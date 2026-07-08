import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET() {
  const { userCollection } = await getCollections();
  const activeStatus = await userCollection.findOne(
    {},
    { projection: { "Tarabi.active": 1 } }
  );
  return NextResponse.json(activeStatus?.Tarabi?.active ?? null);
}
