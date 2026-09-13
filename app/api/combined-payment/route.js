import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { sendSms } from "@/lib/sms";

async function sendConfirmationSms(number, message) {
  if (!number || number.length !== 11) return;
  try {
    await sendSms(number, message);
  } catch {
    // Don't fail the whole action just because the SMS didn't send.
  }
}

export async function POST(request) {
  const body = await request.json();
  const { userId, name, home, monthly, tarabi, due } = body;

  if (!userId || (!monthly && !tarabi && !due)) {
    return NextResponse.json(
      { error: "userId and at least one of monthly, tarabi, due are required" },
      { status: 400 },
    );
  }

  const { userCollection, paymentCollection } = await getCollections();
  const userQuery = { _id: new ObjectId(userId) };
  const user = await userCollection.findOne(userQuery);

  const time = new Date().toLocaleString();
  const year = new Date().getFullYear();
  const messageParts = [];

  if (monthly) {
    await userCollection.updateOne(
      { ...userQuery, "PayMonths.monthName": { $in: monthly.months } },
      { $set: { "PayMonths.$[elem].status": "paid" } },
      { arrayFilters: [{ "elem.monthName": { $in: monthly.months } }] },
    );
    const shortMonths = monthly.months.map((m) => m.slice(0, 3)).join(" ,");
    await paymentCollection.insertOne({
      userId,
      name,
      home,
      fee: monthly.amount,
      monthName: shortMonths,
      type: "Monthly",
      time,
      year,
    });
    messageParts.push(`${shortMonths}'র মাসিক চাঁদা বাবদ ৳${monthly.amount}`);
  }

  if (tarabi) {
    await userCollection.updateOne(userQuery, {
      $set: { "Tarabi.status": "paid" },
    });
    await paymentCollection.insertOne({
      userId,
      name,
      home,
      fee: tarabi.amount,
      type: "Tarabi",
      time,
      year,
    });
    messageParts.push(`তারাবীর চাঁদা বাবদ ৳${tarabi.amount}`);
  }

  if (due) {
    const currentDue = Number(user?.Due || 0);
    const newDue = currentDue - Number(due.amount);
    await userCollection.updateOne(userQuery, { $set: { Due: newDue } });
    await paymentCollection.insertOne({
      userId,
      name,
      home,
      fee: due.amount,
      type: "Due",
      time,
      year,
    });
    messageParts.push(`বকেয়া চাঁদা বাবদ ৳${due.amount}`);
  }

  const joinedParts =
    messageParts.length > 1
      ? messageParts.slice(0, -1).join(", ") +
        " ও " +
        messageParts[messageParts.length - 1]
      : messageParts[0];

  const smsMessage = `আপনি ${joinedParts} পরিশোধ করেছেন।

-ইসলামপুর জামে মসজিদ`;

  await sendConfirmationSms(user?.Number, smsMessage);

  return NextResponse.json({ success: true });
}
