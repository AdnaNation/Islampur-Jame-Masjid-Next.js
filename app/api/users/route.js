import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filter = Object.fromEntries(searchParams.entries());
  const { userCollection } = await getCollections();
  const query = {
    Name: { $regex: filter.search, $options: "i" },
    NameBn: { $regex: filter.searchBn, $options: "i" },
    HomeName: { $regex: filter.HomeName },
  };
  const result = await userCollection.find(query).toArray();
  return NextResponse.json(result);
}
