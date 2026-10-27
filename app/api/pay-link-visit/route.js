import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { bad, isContactNumber } from "@/lib/validate";

// PUBLIC: records that someone opened their personal pay link.
export async function POST(request) {
  const limited = await rateLimit(request, {
    name: "pay-link-visit",
    limit: 20,
    windowSec: 60,
  });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const number = body?.number;
  if (!isContactNumber(number)) return bad("number is required");

  const { linkVisitCollection, userCollection } = await getCollections();
  const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

  const user = await userCollection.findOne({ Number: number });
  if (!user) return NextResponse.json({ success: true }); // don't store strangers

  await linkVisitCollection.updateOne(
    { number },
    {
      // keep only the latest 200 visits so the document can't grow forever
      $push: { visits: { $each: [now], $slice: -200 } },
      $set: {
        lastVisitedAt: now,
        name: user?.NameBn || null,
        home: user?.HomeName || null,
      },
      $setOnInsert: { firstVisitedAt: now },
    },
    { upsert: true },
  );

  return NextResponse.json({ success: true });
}

// ADMIN ONLY: the visit history (phone numbers).
export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { linkVisitCollection } = await getCollections();
  const result = await linkVisitCollection.find().toArray();
  result.sort((a, b) => new Date(b.lastVisitedAt) - new Date(a.lastVisitedAt));
  return NextResponse.json(result);
}
