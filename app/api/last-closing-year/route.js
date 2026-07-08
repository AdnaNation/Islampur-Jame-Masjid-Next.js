import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET() {
  const { lastClosingCollection } = await getCollections();
  const result = await lastClosingCollection.findOne(
    {},
    { projection: { lastSendingYear: 1, _id: 0 } }
  );
  return NextResponse.json(result);
}
