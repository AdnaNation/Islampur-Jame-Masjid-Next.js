import { NextResponse } from "next/server";
import { getAccountCollections, getAccountSettings } from "@/lib/accounts";
import { YMD } from "@/lib/accountReport";

// GET -> { startDate: "yyyy-mm-dd" | "", openingFund: number }
export async function GET() {
  return NextResponse.json(await getAccountSettings());
}

// PUT { startDate, openingFund } -> save (replaces the old values)
export async function PUT(request) {
  const body = await request.json();
  const startDate = String(body.startDate ?? "").trim();
  const fund = Math.round(Number(body.openingFund) * 100) / 100;

  if (
    !YMD.test(startDate) ||
    Number.isNaN(new Date(`${startDate}T00:00:00+06:00`).getTime())
  )
    return NextResponse.json(
      { message: "সঠিক শুরুর তারিখ দিন" },
      { status: 400 },
    );
  if (!Number.isFinite(fund) || Math.abs(fund) > 1e10)
    return NextResponse.json(
      { message: "সঠিক ফান্ডের পরিমাণ দিন" },
      { status: 400 },
    );

  const { settingsCollection } = await getAccountCollections();
  await settingsCollection.updateOne(
    { _id: "accounts" },
    { $set: { startDate, openingFund: fund, updatedAt: new Date() } },
    { upsert: true },
  );
  return NextResponse.json({ startDate, openingFund: fund });
}
