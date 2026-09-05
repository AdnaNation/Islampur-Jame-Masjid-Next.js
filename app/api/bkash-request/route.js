import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function POST(request) {
  const claim = await request.json();

  if (!claim.trxID || !claim.senderNumber || !claim.totalAmount) {
    return NextResponse.json(
      { error: "trxID, senderNumber and totalAmount are required" },
      { status: 400 },
    );
  }

  if (!claim.monthly && !claim.tarabi && !claim.due) {
    return NextResponse.json(
      { error: "At least one of monthly, tarabi or due is required" },
      { status: 400 },
    );
  }

  const { bkashRequestCollection } = await getCollections();

  const doc = {
    userId: claim.userId || null,
    name: claim.name || null,
    home: claim.home || null,
    senderNumber: claim.senderNumber,
    trxID: claim.trxID.trim().toUpperCase(),
    totalAmount: Number(claim.totalAmount),
    sentAmount: Number(claim.sentAmount || claim.totalAmount),
    monthly: claim.monthly
      ? {
          months: claim.monthly.months,
          amount: Number(claim.monthly.amount),
          monthName: claim.monthly.months.map((m) => m.slice(0, 3)).join(" ,"),
        }
      : null,
    tarabi: claim.tarabi ? { amount: Number(claim.tarabi.amount) } : null,
    due: claim.due ? { amount: Number(claim.due.amount) } : null,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  const result = await bkashRequestCollection.insertOne(doc);
  return NextResponse.json(result);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const { bkashRequestCollection } = await getCollections();
  const query = status ? { status } : {};
  const result = await bkashRequestCollection
    .find(query)
    .sort({ submittedAt: -1 })
    .toArray();
  return NextResponse.json(result);
}
