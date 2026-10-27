import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { bad, isPhone, str } from "@/lib/validate";

// remembers "this number was already messaged this month"
export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const b = await request.json().catch(() => null);
  const number = b?.number;
  const lastSendingMonth = str(b?.lastSendingMonth, 20);
  if (!isPhone(number) || !lastSendingMonth) return bad();
  const body = {
    number,
    lastSendingMonth,
    ...(str(b?.message, 1000) ? { message: str(b.message, 1000) } : {}),
  };

  const { whatsappSmsCollection } = await getCollections();
  const alreadyExisted = await whatsappSmsCollection.findOne({ number });
  if (!alreadyExisted) {
    const insertResult = await whatsappSmsCollection.insertOne(body);
    return NextResponse.json({ status: "inserted", result: insertResult });
  }

  if (alreadyExisted.lastSendingMonth !== body.lastSendingMonth) {
    const updateResult = await whatsappSmsCollection.updateOne(
      { number },
      { $set: { lastSendingMonth: body.lastSendingMonth } },
    );
    return NextResponse.json({ status: "updated", result: updateResult });
  }
  return NextResponse.json({
    status: "skipped",
    message: "Already sent for this month",
  });
}
