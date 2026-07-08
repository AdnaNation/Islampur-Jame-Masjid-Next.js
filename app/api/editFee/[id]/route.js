import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const editFee = await request.json();
  const { userCollection } = await getCollections();
  const query = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      FeeRate: editFee.FeeRate,
      "Tarabi.fee": editFee.TarabiFee,
      Due: editFee.DueFee,
    },
  };
  const result = await userCollection.updateOne(query, updatedDoc);
  return NextResponse.json(result);
}
