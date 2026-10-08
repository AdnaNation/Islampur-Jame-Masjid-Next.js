import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function POST(request) {
  const body = await request.json();
  const { whatsappSmsCollection } = await getCollections();
  const alreadyExisted = await whatsappSmsCollection.findOne({
    number: body.number,
  });
  if (!alreadyExisted) {
    const insertResult = await whatsappSmsCollection.insertOne(body);
    return NextResponse.json({ status: "inserted", result: insertResult });
  }

  if (alreadyExisted.lastSendingMonth !== body.lastSendingMonth) {
    const updateResult = await whatsappSmsCollection.updateOne(
      { number: body.number },
      {
        $set: { lastSendingMonth: body.lastSendingMonth },
      },
    );
    return NextResponse.json({ status: "updated", result: updateResult });
  }
  return NextResponse.json({
    status: "skipped",
    message: "Already sent for this month",
  });
}
