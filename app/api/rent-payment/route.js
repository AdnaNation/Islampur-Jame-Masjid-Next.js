import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { createPaySlip } from "@/lib/paySlip";
import { formatMonthRange } from "@/lib/monthRange";
import { actionTime, withIdempotency } from "@/lib/idempotency";
import { isReplay, safeSms, safeWhatsAppReceipt } from "@/lib/notify";
import { requireAdmin } from "@/lib/auth";
import { dhakaYear } from "@/lib/rent";
import { bad, isId, isMonthList, money, str } from "@/lib/validate";

const r2 = (n) => Math.round(n * 100) / 100;

// Rent payment history of one shopkeeper (newest first)
export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const shopId = new URL(request.url).searchParams.get("shopId");
  if (!isId(shopId)) return bad("ভুল আইডি");
  const { rentPaymentCollection } = await getCollections();
  const result = await rentPaymentCollection
    .find({ shopId })
    .sort({ createdAt: -1 })
    .limit(60)
    .toArray();
  return NextResponse.json(result);
}

// Admin marks rent as paid: some months, an old due, or both in one go.
async function createRentPayment(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return bad();

  const shopId = body.shopId;
  if (!isId(shopId)) return bad("ভুল আইডি");
  if (!body.monthly && !body.due) return bad("কিছু সিলেক্ট করা হয়নি");

  // re-build both parts from validated values only
  let monthly = null;
  let due = null;
  if (body.monthly) {
    const amount = money(body.monthly.amount);
    if (!isMonthList(body.monthly.months) || !amount) return bad();
    monthly = { months: [...new Set(body.monthly.months)], amount };
  }
  if (body.due) {
    const amount = money(body.due.amount);
    if (!amount) return bad("বকেয়ার টাকার অংক সঠিক নয়");
    due = { amount };
  }

  const { shopKeeperCollection, rentPaymentCollection } =
    await getCollections();
  const _id = new ObjectId(shopId);
  const shop = await shopKeeperCollection.findOne({ _id });
  if (!shop) return bad("দোকানদার পাওয়া যায়নি", 404);

  const currentDue = Number(shop.Due) || 0;
  if (due && due.amount > currentDue)
    return bad("বকেয়ার চেয়ে বেশি টাকা নেওয়া যাবে না");

  // One atomic update. It only matches while none of the chosen months is paid
  // yet (and the due is still what we just read), so the same money can never
  // be collected twice - not by a double tap, not by two admins, not by a
  // payment that was saved offline and synced later.
  const filter = { _id };
  const set = {};
  const options = {};
  if (monthly) {
    filter.PayMonths = {
      $not: {
        $elemMatch: { monthName: { $in: monthly.months }, status: "paid" },
      },
    };
    set["PayMonths.$[elem].status"] = "paid";
    options.arrayFilters = [{ "elem.monthName": { $in: monthly.months } }];
  }
  if (due) {
    filter.Due = shop.Due ?? null;
    set.Due = r2(currentDue - due.amount);
  }
  const upd = await shopKeeperCollection.updateOne(
    filter,
    { $set: set },
    options,
  );
  if (upd.matchedCount === 0)
    return bad(
      "এই মাস আগেই পরিশোধ করা হয়েছে বা তথ্য বদলে গেছে — পেজ রিফ্রেশ করুন",
    );

  const when = actionTime(request);
  const year = dhakaYear(when);
  const name = shop.NameBn || shop.Name || "";
  const base = { shopId, name, createdAt: when, year };
  const slipItems = [];
  const parts = [];

  if (monthly) {
    const short = formatMonthRange(monthly.months);
    const paid = await rentPaymentCollection.insertOne({
      ...base,
      type: "Monthly",
      fee: monthly.amount,
      months: monthly.months,
      monthName: short,
    });
    slipItems.push({
      type: "RentMonthly",
      amount: monthly.amount,
      months: monthly.months,
      paymentId: paid.insertedId,
    });
    parts.push(`${short}'র দোকান ভাড়া বাবদ ৳${monthly.amount}`);
  }
  if (due) {
    const paid = await rentPaymentCollection.insertOne({
      ...base,
      type: "Due",
      fee: due.amount,
    });
    slipItems.push({
      type: "RentDue",
      amount: due.amount,
      paymentId: paid.insertedId,
    });
    parts.push(`বকেয়া দোকান ভাড়া বাবদ ৳${due.amount}`);
  }

  const slipId = await createPaySlip({
    userId: shopId,
    name,
    home: "দোকান",
    items: slipItems,
    method: "cash",
  });

  const joined = parts.length > 1 ? `${parts[0]} ও ${parts[1]}` : parts[0];
  const total = (monthly?.amount || 0) + (due?.amount || 0);
  const sms = `আপনি ${joined} পরিশোধ করেছেন। -ইসলামপুর জামে মসজিদ।${
    slipId ? `\nislampurjamemasjid.org/pay-slip/${slipId}` : ""
  }`;
  await safeSms(str(shop.Number, 20), sms);

  // online: the admin's phone sends the WhatsApp receipt after this answer
  // (same as the fee page); a payment synced from the offline queue sends it here
  if (isReplay(request)) {
    await safeWhatsAppReceipt({
      to: str(shop.Number, 20),
      totalAmount: total,
      slipId,
    });
  }

  return NextResponse.json({ success: true, slipId });
}

// sign-in check comes first: nobody anonymous may touch the idempotency store
export const POST = async (request) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return withIdempotency(request, () => createRentPayment(request));
};
