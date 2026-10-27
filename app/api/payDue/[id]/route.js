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

  const body = await request.json().catch(() => null);
  const Due = num(body?.DueFee);
  if (Due === null) return bad("টাকার পরিমাণ সঠিক নয়");

  const { userCollection } = await getCollections();
  const result = await userCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { Due } },
  );
  return NextResponse.json(result);
}
