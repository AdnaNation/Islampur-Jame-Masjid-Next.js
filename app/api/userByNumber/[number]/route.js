import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET(request, { params }) {
  const { number } = await params;
  const { userCollection } = await getCollections();
  const query = { Number: number };
  const result = await userCollection.findOne(query);
  return NextResponse.json(result);
}
