import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filter = Object.fromEntries(searchParams.entries());
  const { paymentCollection } = await getCollections();
  const query = {
    name: { $regex: filter.name },
    home: { $regex: filter.home },
  };
  if (query.home.$regex === "home") {
    const result = await paymentCollection.find().toArray();
    return NextResponse.json(result);
  } else {
    const result = await paymentCollection.find(query).toArray();
    return NextResponse.json(result);
  }
}
