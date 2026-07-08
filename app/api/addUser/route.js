import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function POST(request) {
  const addedUser = await request.json();
  const { userCollection } = await getCollections();
  const query = {
    Number: addedUser.Number,
    HomeName: addedUser.HomeName,
    Name: addedUser.Name,
  };
  const existingUser = await userCollection.findOne(query);
  if (existingUser) {
    return NextResponse.json({ message: "user already exists", insertedId: null });
  }
  const result = await userCollection.insertOne(addedUser);
  return NextResponse.json(result);
}
