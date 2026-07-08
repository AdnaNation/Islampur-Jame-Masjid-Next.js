import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET() {
  const { shopKeeperCollection } = await getCollections();
  const result = await shopKeeperCollection.find().toArray();
  return NextResponse.json(result);
}
