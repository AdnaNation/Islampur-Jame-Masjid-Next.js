import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { lastClosingCollection } = await getCollections();
  const lastYear = await lastClosingCollection.findOne(
    {},
    { projection: { lastSendingYear: 1, _id: 0 } }
  );
  const result = await lastClosingCollection.updateOne(
    {},
    { $set: { lastSendingYear: lastYear.lastSendingYear + 1 } }
  );
  return NextResponse.json(result);
}
