import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { bad, isId } from "@/lib/validate";

export async function GET(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!isId(id)) return bad("ভুল আইডি");
  const { shopKeeperCollection } = await getCollections();
  const query = { _id: new ObjectId(id) };
  const result = await shopKeeperCollection.findOne(query);
  return NextResponse.json(result);
}
