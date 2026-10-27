import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { sendSms } from "@/lib/sms";
import { requireAdmin } from "@/lib/auth";
import { bad, isPhone, str } from "@/lib/validate";

const MAX_TARGETS = 3000;

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const message = str(body?.message, 1000);
  if (!message) return bad("Message is required");

  let targets = Array.isArray(body?.numbers)
    ? [...new Set(body.numbers.filter(isPhone))]
    : [];

  // No specific numbers given - send to every member with a valid 11-digit
  // number on file (same filter as /api/usersNumber).
  if (targets.length === 0) {
    const { userCollection } = await getCollections();
    const users = await userCollection
      .find({ Number: { $regex: /^\d{11}$/ } }, { projection: { Number: 1 } })
      .toArray();
    targets = users.map((u) => u.Number);
  }
  if (targets.length > MAX_TARGETS) return bad("অনেক বেশি নাম্বার");

  const results = await Promise.allSettled(
    targets.map((number) => sendSms(number, message)),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results
    .map((r, i) => (r.status === "rejected" ? targets[i] : null))
    .filter(Boolean);

  return NextResponse.json({ total: targets.length, sent, failed });
}
