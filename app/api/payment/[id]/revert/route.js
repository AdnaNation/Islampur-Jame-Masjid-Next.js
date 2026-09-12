import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { sendSms } from "@/lib/sms";

const REVERT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// Maps English month abbreviations (as stored in payment.monthName, e.g.
// "Jan ,Feb") back to full month names (as stored in PayMonths.monthName).
const monthAbbrevToFull = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};

async function sendRevertSms(number, message) {
  if (!number || number.length !== 11) return;
  try {
    await sendSms(number, message);
  } catch {
    // Don't fail the revert just because the SMS didn't send.
  }
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { userCollection, paymentCollection } = await getCollections();

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

  if (payment.type === "Monthly") {
    const fullMonths = payment.monthName
      .split(",")
      .map((m) => monthAbbrevToFull[m.trim()])
      .filter(Boolean);

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
  smsMessage += `
  
-ইসলামপুর জামে মসজিদ`;

  const result = await paymentCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { reverted: true, revertedAt: new Date().toISOString() } },
  );

  await sendRevertSms(user?.Number, smsMessage);

  return NextResponse.json(result);
}
