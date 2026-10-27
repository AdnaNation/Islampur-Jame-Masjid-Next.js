import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rateLimit";

// List of home names for the dropdowns. Distinct names only - no member ids.
export async function GET(request) {
  const limited = await rateLimit(request, {
    name: "users-home",
    limit: 60,
    windowSec: 60,
  });
  if (limited) return limited;

  const { userCollection } = await getCollections();

  // aggregate + $group instead of distinct(): distinct is blocked by apiStrict
  const rows = await userCollection
    .aggregate([
      { $match: { HomeName: { $type: "string", $ne: "" } } },
      { $group: { _id: "$HomeName" } },
    ])
    .toArray();

  return NextResponse.json(rows.map((r) => ({ HomeName: r._id })));
}