import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { shopKeeperCollection } = await getCollections();
  const result = await shopKeeperCollection.find().toArray();
  return NextResponse.json(result);
}
