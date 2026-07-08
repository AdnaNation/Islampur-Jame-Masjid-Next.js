import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const editFee = await request.json();
  const { userCollection } = await getCollections();
  const query = { _id: new ObjectId(id) };
  const result = await userCollection.updateOne(query, {
    $set: {
      Due: editFee.DueFee,
    },
  });
  return NextResponse.json(result);
}
