import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET(request, { params }) {
  const { home } = await params;
  const { userCollection } = await getCollections();
  const query = { HomeName: home };
  if (query.HomeName === "home") {
    const result = await userCollection
      .find({}, { projection: { NameBn: 1 } })
      .toArray();
    return NextResponse.json(result);
  } else {
    const result = await userCollection
      .find(query, { projection: { NameBn: 1 } })
      .toArray();
    return NextResponse.json(result);
  }
}
