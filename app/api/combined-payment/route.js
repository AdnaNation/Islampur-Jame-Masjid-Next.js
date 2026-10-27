import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { sendSms } from "@/lib/sms";
import { formatMonthRange } from "@/lib/monthRange";
import { createPaySlip } from "@/lib/paySlip";
import { actionTime, withIdempotency } from "@/lib/idempotency";
import { isReplay, safeWhatsAppReceipt } from "@/lib/notify";
import { requireAdmin } from "@/lib/auth";
import { bad, isId, isMonthList, money, str } from "@/lib/validate";

async function sendConfirmationSms(number, message) {
  if (!number || number.length !== 11) return;
  try {
    await sendSms(number, message);
  } catch {
    // Don't fail the whole action just because the SMS didn't send.
  }
}

async function createCombinedPayment(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return bad();
  const userId = body.userId;
  const name = str(body.name, 100);
  const home = str(body.home, 100);

  if (!isId(userId) || (!body.monthly && !body.tarabi && !body.due)) {
    return NextResponse.json(
      { error: "userId and at least one of monthly, tarabi, due are required" },
      { status: 400 },
    );
  }

  // re-build the three parts from validated values only
  let monthly = null;
  let tarabi = null;
  let due = null;
  if (body.monthly) {
    const amount = money(body.monthly.amount);
    if (!isMonthList(body.monthly.months) || !amount) return bad();
    monthly = { months: body.monthly.months, amount };
  }
  if (body.tarabi) {
    const amount = money(body.tarabi.amount);
    if (!amount) return bad();
    tarabi = { amount };
  }
  if (body.due) {
    const amount = money(body.due.amount);
    if (!amount) return bad();
    due = { amount };
  }

  const { userCollection, paymentCollection } = await getCollections();
  const userQuery = { _id: new ObjectId(userId) };
  const user = await userCollection.findOne(userQuery);

  const when = actionTime(request);
  const time = when.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  const year = when.getFullYear();
  const messageParts = [];
  const slipItems = [];

  if (monthly) {
    await userCollection.updateOne(
      { ...userQuery, "PayMonths.monthName": { $in: monthly.months } },
      { $set: { "PayMonths.$[elem].status": "paid" } },
      { arrayFilters: [{ "elem.monthName": { $in: monthly.months } }] },
    );
    const shortMonths = formatMonthRange(monthly.months);
    const paid = await paymentCollection.insertOne({
      userId,
      name,
      home,
      fee: monthly.amount,
      monthName: shortMonths,
      type: "Monthly",
      time,
      year,
    });
    slipItems.push({
      type: "Monthly",
      amount: monthly.amount,
      months: monthly.months,
      paymentId: paid.insertedId,
    });
    messageParts.push(`${shortMonths}'র মাসিক চাঁদা বাবদ ৳${monthly.amount}`);
  }

  if (tarabi) {
    await userCollection.updateOne(userQuery, {
      $set: { "Tarabi.status": "paid" },
    });
    const paid = await paymentCollection.insertOne({
      userId,
      name,
      home,
      fee: tarabi.amount,
      type: "Tarabi",
      time,
      year,
    });
    slipItems.push({
      type: "Tarabi",
      amount: tarabi.amount,
      paymentId: paid.insertedId,
    });
    messageParts.push(`তারাবীর চাঁদা বাবদ ৳${tarabi.amount}`);
  }

  if (due) {
    const currentDue = Number(user?.Due || 0);
    const newDue = currentDue - Number(due.amount);
    await userCollection.updateOne(userQuery, { $set: { Due: newDue } });
    const paid = await paymentCollection.insertOne({
      userId,
      name,
      home,
      fee: due.amount,
      type: "Due",
      time,
      year,
    });
    slipItems.push({
      type: "Due",
      amount: due.amount,
      paymentId: paid.insertedId,
    });
    messageParts.push(`বকেয়া চাঁদা বাবদ ৳${due.amount}`);
  }

  const joinedParts =
    messageParts.length > 1
      ? messageParts.slice(0, -1).join(", ") +
        " ও " +
        messageParts[messageParts.length - 1]
      : messageParts[0];

  // One slip for everything paid in this single transaction.
  const slipId = await createPaySlip({
    userId,
    name,
    home,
    items: slipItems,
    method: "cash",
  });

  const smsMessage = `আপনি ${joinedParts} পরিশোধ করেছেন। -ইসলামপুর জামে মসজিদ।
  islampurjamemasjid.org/pay-slip/${slipId}`;

  await sendConfirmationSms(user?.Number, smsMessage);

  if (isReplay(request)) {
    const total = [monthly, tarabi, due].reduce(
      (sum, part) => sum + Number(part?.amount || 0),
      0,
    );
    await safeWhatsAppReceipt({ to: user?.Number, totalAmount: total, slipId });
  }

  return NextResponse.json({ success: true, slipId });
}

// sign-in check comes first: nobody anonymous may touch the idempotency store
export const POST = async (request) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return withIdempotency(request, () => createCombinedPayment(request));
};
