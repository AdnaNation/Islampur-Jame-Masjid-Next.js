import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { sendSms } from "@/lib/sms";

async function sendConfirmationSms(number, message) {
  if (!number || number.length !== 11) return;
  try {
    await sendSms(number, message);
  } catch {
    // Don't fail the whole approval just because the SMS didn't send.
  }
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { userCollection, paymentCollection, bkashRequestCollection } =
    await getCollections();

  const claim = await bkashRequestCollection.findOne({ _id: new ObjectId(id) });
  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }
  if (claim.status !== "pending") {
    return NextResponse.json(
      { error: `Claim already ${claim.status}` },
      { status: 409 },
    );
  }

  const time = new Date().toLocaleString();
  const year = new Date().getFullYear();
  const messageParts = [];
  let smsNumber = null;

  const userQuery = claim.userId ? { _id: new ObjectId(claim.userId) } : null;
  const user = userQuery ? await userCollection.findOne(userQuery) : null;
  smsNumber = user?.Number;

  // --- Monthly portion ---
  if (claim.monthly && userQuery) {
    await userCollection.updateOne(
      { ...userQuery, "PayMonths.monthName": { $in: claim.monthly.months } },
      { $set: { "PayMonths.$[elem].status": "paid" } },
      { arrayFilters: [{ "elem.monthName": { $in: claim.monthly.months } }] },
    );
    await paymentCollection.insertOne({
      userId: claim.userId,
      name: claim.name,
      home: claim.home,
      fee: claim.monthly.amount,
      monthName: claim.monthly.monthName,
      type: "Monthly",
      time,
      year,
      method: "bKash",
      trxID: claim.trxID,
      senderNumber: claim.senderNumber,
      combinedTotal: claim.totalAmount,
      combinedSentAmount: claim.sentAmount,
    });
    messageParts.push(
      `${claim.monthly.monthName}'র মাসিক চাঁদা বাবদ ৳${claim.monthly.amount}`,
    );
  }

  // --- Tarabi portion ---
  if (claim.tarabi && userQuery) {
    await userCollection.updateOne(userQuery, {
      $set: { "Tarabi.status": "paid" },
    });
    await paymentCollection.insertOne({
      userId: claim.userId,
      name: claim.name,
      home: claim.home,
      fee: claim.tarabi.amount,
      type: "Tarabi",
      time,
      year,
      method: "bKash",
      trxID: claim.trxID,
      senderNumber: claim.senderNumber,
      combinedTotal: claim.totalAmount,
      combinedSentAmount: claim.sentAmount,
    });
    messageParts.push(`তারাবীর চাঁদা বাবদ ৳${claim.tarabi.amount}`);
  }

  // --- Due portion ---
  if (claim.due && userQuery) {
    const currentDue = Number(user?.Due || 0);
    const newDue = currentDue - Number(claim.due.amount);
    await userCollection.updateOne(userQuery, { $set: { Due: newDue } });
    await paymentCollection.insertOne({
      userId: claim.userId,
      name: claim.name,
      home: claim.home,
      fee: claim.due.amount,
      type: "Due",
      time,
      year,
      method: "bKash",
      trxID: claim.trxID,
      senderNumber: claim.senderNumber,
      combinedTotal: claim.totalAmount,
      combinedSentAmount: claim.sentAmount,
    });
    messageParts.push(`বকেয়া চাঁদা বাবদ ৳${claim.due.amount}`);
  }

  // One combined SMS covering everything paid in this single bKash send.
  const joinedParts =
    messageParts.length > 1
      ? messageParts.slice(0, -1).join(", ") +
        " ও " +
        messageParts[messageParts.length - 1]
      : messageParts[0];

  const smsMessage = `আপনি ${joinedParts} পরিশোধ করেছেন।

-ইসলামপুর জামে মসজিদ`;

  await sendConfirmationSms(smsNumber, smsMessage);

  const result = await bkashRequestCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "approved", reviewedAt: new Date().toISOString() } },
  );

  return NextResponse.json(result);
}
