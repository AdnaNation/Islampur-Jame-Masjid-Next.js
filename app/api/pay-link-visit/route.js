import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function POST(request) {
  const { number } = await request.json();
  if (!number) {
    return NextResponse.json({ error: "number is required" }, { status: 400 });
  }

  const { linkVisitCollection, userCollection } = await getCollections();
  const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

  const user = await userCollection.findOne({ Number: number });

  await linkVisitCollection.updateOne(
    { number },
    {
      $push: { visits: now },
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

export async function GET() {
  const { linkVisitCollection } = await getCollections();
  const result = await linkVisitCollection.find().toArray();
  result.sort((a, b) => new Date(b.lastVisitedAt) - new Date(a.lastVisitedAt));
  return NextResponse.json(result);
}
