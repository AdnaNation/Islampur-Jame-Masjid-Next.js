import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function PATCH() {
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
