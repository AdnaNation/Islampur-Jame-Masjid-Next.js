import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getCollections } from "@/lib/mongodb";
import { sendSms } from "@/lib/sms";
import { parseMonthRange } from "@/lib/monthRange";
import { requireAdmin } from "@/lib/auth";
import { bad, isId } from "@/lib/validate";

const REVERT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

async function sendRevertSms(number, message) {
  if (!number || number.length !== 11) return;
  try {
    await sendSms(number, message);
  } catch {
    // Don't fail the revert just because the SMS didn't send.
  }
}

export async function PATCH(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!isId(id)) return bad("ভুল আইডি");
  const { userCollection, paymentCollection, paySlipCollection } =
    await getCollections();

  const payment = await paymentCollection.findOne({ _id: new ObjectId(id) });
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }
  if (payment.reverted) {
    return NextResponse.json(
      { error: "This payment is already reverted" },
      { status: 409 },
    );
  }
  if (!payment.userId) {
    return NextResponse.json(
      { error: "This payment has no linked member, can't auto-revert" },
      { status: 400 },
    );
  }

  const paidAt = new Date(payment.time).getTime();
  const elapsed = Date.now() - paidAt;
  if (Number.isNaN(paidAt) || elapsed > REVERT_WINDOW_MS) {
    return NextResponse.json(
      { error: "পেমেন্টের ২৪ ঘণ্টা পার হয়ে গেছে, এখন বাতিল করা যাবে না" },
      { status: 403 },
    );
  }

  const userQuery = { _id: new ObjectId(payment.userId) };
  const user = await userCollection.findOne(userQuery);
  let smsMessage = "";
  let result = null;

  if (payment.type === "Advance") {
    const fee = Number(payment.fee) || 0;
    if (!(fee > 0)) return bad("অগ্রিমের টাকার পরিমাণ সঠিক নয়");
    const client = await clientPromise;
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const current = await paymentCollection.findOne(
          { _id: new ObjectId(id), reverted: { $ne: true } },
          { session },
        );
        if (!current) {
          const error = new Error("পেমেন্টটি ইতিমধ্যে বাতিল করা হয়েছে");
          error.status = 409;
          throw error;
        }
        const currentUser = await userCollection.findOne(userQuery, { session });
        const lots = Array.isArray(currentUser?.AdvanceLots)
          ? currentUser.AdvanceLots
          : null;
        if (lots) {
          const lotIndex = lots.findIndex(
            (lot) => String(lot.paymentId || "") === id,
          );
          const lot = lotIndex >= 0 ? lots[lotIndex] : null;
          if (!lot || Number(lot.remaining) + 1e-8 < fee) {
            const error = new Error("এই অগ্রিমের টাকা ইতিমধ্যে ব্যবহার হয়ে গেছে, তাই বাতিল করা যাবে না");
            error.status = 409;
            throw error;
          }
          const nextLots = lots
            .map((item, index) =>
              index === lotIndex
                ? {
                    ...item,
                    remaining: Math.round((Number(item.remaining) - fee) * 100) / 100,
                  }
                : item,
            )
            .filter((item) => Number(item.remaining) > 0);
          const taken = await userCollection.updateOne(
            { ...userQuery, Advance: { $gte: fee } },
            {
              $inc: { Advance: -fee },
              $set: { AdvanceLots: nextLots },
            },
            { session },
          );
          if (!taken.matchedCount) {
            const error = new Error("এই অগ্রিমের টাকা ইতিমধ্যে ব্যবহার হয়ে গেছে, তাই বাতিল করা যাবে না");
            error.status = 409;
            throw error;
          }
        } else {
          // Legacy advance balances created before receipt-level tracking.
          const taken = await userCollection.updateOne(
            { ...userQuery, Advance: { $gte: fee } },
            { $inc: { Advance: -fee } },
            { session },
          );
          if (!taken.matchedCount) {
            const error = new Error("এই অগ্রিমের টাকা ইতিমধ্যে ব্যবহার হয়ে গেছে, তাই বাতিল করা যাবে না");
            error.status = 409;
            throw error;
          }
        }
        result = await paymentCollection.updateOne(
          { _id: new ObjectId(id), reverted: { $ne: true } },
          { $set: { reverted: true, revertedAt: new Date().toISOString() } },
          { session },
        );
        if (!result.modifiedCount) {
          const error = new Error("পেমেন্টটি ইতিমধ্যে বাতিল করা হয়েছে");
          error.status = 409;
          throw error;
        }
      });
    } catch (err) {
      if (err?.status === 409) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      throw err;
    } finally {
      await session.endSession();
    }
    smsMessage = `আপনার অগ্রিম চাঁদা বাবদ ৳${payment.fee} জমার এন্ট্রিটি ভুলবশত হয়েছিল, তাই বাতিল করা হয়েছে।`;
  } else if (payment.type === "Monthly") {
    const fullMonths = parseMonthRange(payment.monthName);
    await userCollection.updateOne(
      { ...userQuery, "PayMonths.monthName": { $in: fullMonths } },
      { $set: { "PayMonths.$[elem].status": "unpaid" } },
      { arrayFilters: [{ "elem.monthName": { $in: fullMonths } }] },
    );
    smsMessage = `আপনার ${payment.monthName}'র মাসিক চাঁদা বাবদ ৳${payment.fee} পরিশোধের এন্ট্রিটি ভুলবশত হয়েছিল, তাই বাতিল করা হয়েছে।`;
  } else if (payment.type === "Tarabi") {
    await userCollection.updateOne(userQuery, {
      $set: { "Tarabi.status": "unpaid" },
    });
    smsMessage = `আপনার তারাবীর চাঁদা বাবদ ৳${payment.fee} পরিশোধের এন্ট্রিটি ভুলবশত হয়েছিল, তাই বাতিল করা হয়েছে।`;
  } else if (payment.type === "Due") {
    const currentDue = Number(user?.Due || 0);
    const restoredDue = currentDue + Number(payment.fee);
    await userCollection.updateOne(userQuery, { $set: { Due: restoredDue } });
    smsMessage = `আপনার বকেয়া চাঁদা বাবদ ৳${payment.fee} পরিশোধের এন্ট্রিটি ভুলবশত হয়েছিল, তাই বাতিল করা হয়েছে।`;
  }
  smsMessage += ` -ইসলামপুর জামে মসজিদ`;

  if (!result) {
    result = await paymentCollection.updateOne(
      { _id: new ObjectId(id), reverted: { $ne: true } },
      { $set: { reverted: true, revertedAt: new Date().toISOString() } },
    );
  }

  // Mark the matching line on the public slip as cancelled.
  try {
    await paySlipCollection.updateOne(
      { "items.paymentId": id },
      { $set: { "items.$[i].reverted": true } },
      { arrayFilters: [{ "i.paymentId": id }] },
    );
  } catch (err) {
    console.error("Failed to mark pay slip item as reverted:", err);
  }

  await sendRevertSms(user?.Number, smsMessage);

  return NextResponse.json(result);
}
