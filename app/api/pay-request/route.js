import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { formatMonthRange } from "@/lib/monthRange";
import { bad, isId, isMonthList, money, str } from "@/lib/validate";

const TRX_RE = /^[A-Za-z0-9\-_/.]{4,40}$/;
const SENDER_RE = /^[0-9+\-\s]{5,25}$/;
const same = (a, b) => Math.abs(a - b) < 0.01;

// PUBLIC: a member submits "I paid, here is my TrxID" for the admin to approve.
// Everything that matters (name, home, amounts) is taken from the database,
// not from what the browser says.
export async function POST(request) {
  const limited = await rateLimit(request, {
    name: "pay-request",
    limit: 10,
    windowSec: 600,
  });
  if (limited) return limited;

  const claim = await request.json().catch(() => null);
  if (!claim || typeof claim !== "object") return bad();

  const trxID = str(claim.trxID, 40).toUpperCase();
  const senderNumber = str(claim.senderNumber, 25);
  if (!TRX_RE.test(trxID)) return bad("TrxID সঠিক নয়");
  if (!SENDER_RE.test(senderNumber)) return bad("নাম্বার সঠিক নয়");
  if (!isId(claim.userId)) return bad("সদস্য বেছে নিন");
  if (!claim.monthly && !claim.tarabi && !claim.due)
    return bad("কমপক্ষে একটি চাঁদা বেছে নিন");

  const { userCollection, bkashRequestCollection } = await getCollections();
  const user = await userCollection.findOne({ _id: new ObjectId(claim.userId) });
  if (!user) return bad("সদস্য পাওয়া যায়নি", 404);

  // ---- re-check every amount against what this member really owes ----
  let monthly = null;
  let tarabi = null;
  let due = null;

  if (claim.monthly) {
    const months = claim.monthly.months;
    if (!isMonthList(months) || new Set(months).size !== months.length)
      return bad("মাস সঠিক নয়");
    const unpaid = new Set(
      (user.PayMonths || [])
        .filter((m) => m.status === "unpaid")
        .map((m) => m.monthName),
    );
    if (!months.every((m) => unpaid.has(m)))
      return bad("বেছে নেওয়া মাস আগেই পরিশোধ করা হয়েছে");
    const amount = money(claim.monthly.amount);
    if (amount === null || !same(amount, Number(user.FeeRate || 0) * months.length))
      return bad("মাসিক চাঁদার পরিমাণ মিলছে না");
    monthly = { months, amount, monthName: formatMonthRange(months) };
  }

  if (claim.tarabi) {
    const amount = money(claim.tarabi.amount);
    if (
      user.Tarabi?.status !== "unpaid" ||
      amount === null ||
      !same(amount, Number(user.Tarabi?.fee || 0))
    )
      return bad("তারাবীর চাঁদার পরিমাণ মিলছে না");
    tarabi = { amount };
  }

  if (claim.due) {
    const amount = money(claim.due.amount);
    if (amount === null || amount <= 0 || amount > Number(user.Due || 0))
      return bad("বকেয়ার পরিমাণ মিলছে না");
    due = { amount };
  }

  const totalAmount =
    (monthly?.amount || 0) + (tarabi?.amount || 0) + (due?.amount || 0);
  if (!(totalAmount > 0)) return bad("টাকার পরিমাণ সঠিক নয়");

  // mobile-banking charge may be added on top, but never an absurd amount
  const sentAmount = money(claim.sentAmount ?? totalAmount) ?? totalAmount;
  if (sentAmount < totalAmount || sentAmount > totalAmount * 1.2 + 10)
    return bad("পাঠানো টাকার পরিমাণ মিলছে না");

  // the same TrxID can not be claimed twice; and no flooding of the admin's list
  if (await bkashRequestCollection.findOne({ trxID, status: { $ne: "rejected" } }))
    return bad("এই TrxID আগেই জমা দেওয়া হয়েছে", 409);
  if (
    (await bkashRequestCollection.countDocuments({
      userId: claim.userId,
      status: "pending",
    })) >= 5
  )
    return bad("আগের অনুরোধগুলো যাচাই হওয়া পর্যন্ত অপেক্ষা করুন", 429);

  const doc = {
    userId: claim.userId,
    name: user.NameBn || user.Name || null,
    home: user.HomeName || null,
    method: ["nagad", "bank"].includes(claim.method) ? claim.method : "bkash",
    senderNumber,
    trxID,
    totalAmount,
    sentAmount,
    monthly,
    tarabi,
    due,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  const result = await bkashRequestCollection.insertOne(doc);
  return NextResponse.json(result);
}

// ADMIN ONLY: the review list.
export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const status = new URL(request.url).searchParams.get("status");
  const { bkashRequestCollection } = await getCollections();
  const query = ["pending", "approved", "rejected"].includes(status)
    ? { status }
    : {};
  const result = await bkashRequestCollection
    .find(query)
    .sort({ submittedAt: -1 })
    .limit(1000)
    .toArray();
  return NextResponse.json(result);
}
