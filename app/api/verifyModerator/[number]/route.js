import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

// Returns true only for a doc in the `admin` collection with moderator: true
export async function GET(request, { params }) {
  const { number } = await params;
  const { adminCollection } = await getCollections();
  const result = await adminCollection.findOne({ number });
  return NextResponse.json(result?.moderator === true);
}
