import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";

export async function GET(request, { params }) {
  const { id } = await params;
  const { userCollection } = await getCollections();
  const query = { _id: new ObjectId(id) };
  const result = await userCollection.findOne(query);
  return NextResponse.json(result);
}
