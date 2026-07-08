import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function POST(request) {
  const addedUser = await request.json();
  const { shopKeeperCollection } = await getCollections();
  const query = {
    NameBn: addedUser.NameBn,
  };
  const existingUser = await shopKeeperCollection.findOne(query);
  if (existingUser) {
    return NextResponse.json({ message: "user already exists", insertedId: null });
  }
  const result = await shopKeeperCollection.insertOne(addedUser);
  return NextResponse.json(result);
}
