import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { lastClosingCollection } = await getCollections();
  const result = await lastClosingCollection.findOne(
    {},
    { projection: { lastSendingYear: 1, _id: 0 } }
  );
  return NextResponse.json(result);
}
