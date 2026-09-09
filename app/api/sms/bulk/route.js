import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { sendSms } from "@/lib/sms";

export async function POST(request) {
  const { message, numbers } = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  let targets = numbers;

  // No specific numbers given - send to every member with a valid 11-digit
  // number on file (same filter as /api/usersNumber).
  if (!targets || targets.length === 0) {
    const { userCollection } = await getCollections();
    const users = await userCollection
      .find({ Number: { $regex: /^\d{11}$/ } }, { projection: { Number: 1 } })
      .toArray();
    targets = users.map((u) => u.Number);
  }

  const results = await Promise.allSettled(
    targets.map((number) => sendSms(number, message)),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results
    .map((r, i) => (r.status === "rejected" ? targets[i] : null))
    .filter(Boolean);

  return NextResponse.json({ total: targets.length, sent, failed });
}
