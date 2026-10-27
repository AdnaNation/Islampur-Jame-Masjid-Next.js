import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { userCollection } = await getCollections();
  const result = await userCollection
    .find({ Number: { $exists: true, $ne: "" } }, { projection: { Number: 1 } })
    .toArray();
  return NextResponse.json(result);
}
