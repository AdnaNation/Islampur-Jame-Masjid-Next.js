import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const userData = await request.json();
  const { userCollection, paymentCollection } = await getCollections();
  const query = { _id: new ObjectId(id) };
  const query2 = { userId: id };
  const updatedDoc = {
    $set: {
      NameBn: userData.NameBn,
      Name: userData.Name,
      HomeName: userData.HomeName,
      Number: userData.Number,
    },
  };
  const updatedDoc2 = {
    $set: {
      name: userData.NameBn,
      home: userData.HomeName,
    },
  };
  const result = await userCollection.updateOne(query, updatedDoc);
  if (result.modifiedCount > 0) {
    paymentCollection.updateMany(query2, updatedDoc2);
  }
  return NextResponse.json(result);
}
