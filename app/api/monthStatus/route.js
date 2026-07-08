import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";

export async function PATCH(request) {
  const { id, selectedMonth } = await request.json();
  const { userCollection } = await getCollections();
  const query = {
    _id: new ObjectId(id),
    "PayMonths.monthName": selectedMonth,
  };
  const result = await userCollection.updateOne(query, {
    $set: { "PayMonths.$.status": "paid" },
  });
  return NextResponse.json(result);
}
