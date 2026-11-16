import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { safeSms } from "@/lib/notify";
import { requireAdmin } from "@/lib/auth";
import { dhakaYear } from "@/lib/rent";
import { bad, isId, str } from "@/lib/validate";

const REVERT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours, same as member fees
const r2 = (n) => Math.round(n * 100) / 100;

// Undo a rent payment that was marked by mistake.
export async function PATCH(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!isId(id)) return bad("ভুল আইডি");

  const { shopKeeperCollection, rentPaymentCollection, paySlipCollection } =
    await getCollections();

  const payment = await rentPaymentCollection.findOne({
    _id: new ObjectId(id),
  });
  if (!payment) return bad("পেমেন্ট পাওয়া যায়নি", 404);
  if (payment.reverted) return bad("এই পেমেন্ট আগেই বাতিল করা হয়েছে", 409);

  const paidAt = new Date(payment.createdAt).getTime();
  if (Number.isNaN(paidAt) || Date.now() - paidAt > REVERT_WINDOW_MS)
    return bad("পেমেন্টের ২৪ ঘণ্টা পার হয়ে গেছে, এখন বাতিল করা যাবে না", 403);

  // after the year is closed the months belong to the old year: do not touch them
  if (payment.year !== dhakaYear())
    return bad("বছর শেষ হয়ে গেছে, এখন বাতিল করা যাবে না", 403);

  const shop = await shopKeeperCollection.findOne({
    _id: new ObjectId(payment.shopId),
  });
  if (!shop) return bad("দোকানদার পাওয়া যায়নি", 404);

  // claim the revert first, so two taps can never undo the same payment twice
  const claimed = await rentPaymentCollection.findOneAndUpdate(
    { _id: payment._id, reverted: { $ne: true } },
    { $set: { reverted: true, revertedAt: new Date().toISOString() } },
  );
  if (!claimed) return bad("এই পেমেন্ট আগেই বাতিল করা হয়েছে", 409);

  try {
    if (payment.type === "Monthly") {
      const months = Array.isArray(payment.months) ? payment.months : [];
      await shopKeeperCollection.updateOne(
        { _id: shop._id },
        { $set: { "PayMonths.$[elem].status": "unpaid" } },
        { arrayFilters: [{ "elem.monthName": { $in: months } }] },
      );
    } else if (payment.type === "Due") {
      const current = Number(shop.Due) || 0;
      await shopKeeperCollection.updateOne(
        { _id: shop._id },
        { $set: { Due: r2(current + Number(payment.fee)) } },
      );
    }
  } catch (err) {
    // put the payment back as it was, then report the failure
    await rentPaymentCollection
      .updateOne(
        { _id: payment._id },
        { $unset: { reverted: "", revertedAt: "" } },
      )
      .catch(() => {});
    throw err;
  }

  // mark the matching line on the public slip as cancelled
  try {
    await paySlipCollection.updateOne(
      { "items.paymentId": id },
      { $set: { "items.$[i].reverted": true } },
      { arrayFilters: [{ "i.paymentId": id }] },
    );
  } catch (err) {
    console.error("Failed to mark rent slip item as reverted:", err);
  }

  const what =
    payment.type === "Monthly"
      ? `${payment.monthName}'র দোকান ভাড়া`
      : "বকেয়া দোকান ভাড়া";
  await safeSms(
    str(shop.Number, 20),
    `আপনার ${what} বাবদ ৳${payment.fee} পরিশোধের এন্ট্রিটি ভুলবশত হয়েছিল, তাই বাতিল করা হয়েছে। -ইসলামপুর জামে মসজিদ`,
  );

  return NextResponse.json({ success: true });
}
