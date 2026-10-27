import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { userCollection } = await getCollections();
  const result = await userCollection.updateMany({}, [
    {
      $set: {
        "Tarabi.active": {
          $cond: {
            if: { $eq: ["$Tarabi.active", true] },
            then: false,
            else: true,
          },
        },
      },
    },
  ]);
  return NextResponse.json(result);
}
