import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET() {
  const { userCollection } = await getCollections();
  const result = await userCollection
    .find({ Number: { $regex: /^\d{11}$/ } }, { projection: { Number: 1 } })
    .toArray();
  return NextResponse.json(result);
}
