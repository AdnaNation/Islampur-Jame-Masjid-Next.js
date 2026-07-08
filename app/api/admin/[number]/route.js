import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET(request, { params }) {
  const { number } = await params;
  const { adminCollection } = await getCollections();
  const query = { number: number };
  const result = await adminCollection.findOne(query);
  return NextResponse.json(result);
}
