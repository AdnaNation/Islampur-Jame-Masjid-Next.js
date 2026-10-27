import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { bad, isId, num } from "@/lib/validate";

export async function PATCH(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!isId(id)) return bad("ভুল আইডি");

  const editFee = await request.json().catch(() => null);
  const FeeRate = num(editFee?.FeeRate, 0);
  const TarabiFee = num(editFee?.TarabiFee, 0);
  const DueFee = num(editFee?.DueFee);
  if (FeeRate === null || TarabiFee === null || DueFee === null)
    return bad("টাকার পরিমাণ সঠিক নয়");

  const { userCollection } = await getCollections();
  const result = await userCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { FeeRate, "Tarabi.fee": TarabiFee, Due: DueFee } },
  );
  return NextResponse.json(result);
}
