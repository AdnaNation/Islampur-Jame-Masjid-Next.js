import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function POST(request) {
  const paymentData = await request.json();
  const { paymentCollection } = await getCollections();
  const result = await paymentCollection.insertOne(paymentData);
  return NextResponse.json(result);
}
