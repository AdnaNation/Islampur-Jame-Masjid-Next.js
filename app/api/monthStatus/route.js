import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { bad, isId, MONTHS } from "@/lib/validate";

export async function PATCH(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const id = body?.id;
  const selectedMonth = body?.selectedMonth;
  if (!isId(id) || !MONTHS.includes(selectedMonth)) return bad();

  const { userCollection } = await getCollections();
  const result = await userCollection.updateOne(
    { _id: new ObjectId(id), "PayMonths.monthName": selectedMonth },
    { $set: { "PayMonths.$.status": "paid" } },
  );
  return NextResponse.json(result);
}
