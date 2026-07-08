import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";

export async function GET(request, { params }) {
  const { id } = await params;
  const { shopKeeperCollection } = await getCollections();
  const query = { _id: new ObjectId(id) };
  const result = await shopKeeperCollection.findOne(query);
  return NextResponse.json(result);
}
