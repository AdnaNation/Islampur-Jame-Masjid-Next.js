import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";

export async function PATCH(request) {
  const updating = await request.json();
  const { userCollection } = await getCollections();
  const filter = {
    _id: new ObjectId(updating.id),
    "PayMonths.monthName": { $in: updating.months },
  };
  const update = { $set: { "PayMonths.$[elem].status": "paid" } };
  const options = {
    arrayFilters: [{ "elem.monthName": { $in: updating.months } }],
  };
  const result = await userCollection.updateOne(filter, update, options);
  return NextResponse.json(result);
}
