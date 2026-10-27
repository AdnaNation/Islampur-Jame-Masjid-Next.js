import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { bad, isId, str } from "@/lib/validate";

export async function PATCH(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!isId(id)) return bad("ভুল আইডি");

  const b = await request.json().catch(() => null);
  const NameBn = str(b?.NameBn, 100);
  const Name = str(b?.Name, 100);
  const HomeName = str(b?.HomeName, 100);
  const Number = str(b?.Number, 20);
  if (!NameBn || !HomeName) return bad("নাম ও বাড়ির নাম দিন");

  const { userCollection, paymentCollection } = await getCollections();
  const result = await userCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { NameBn, Name, HomeName, Number } },
  );
  if (result.modifiedCount > 0) {
    // keep the name/home printed on old payment records in step
    await paymentCollection.updateMany(
      { userId: id },
      { $set: { name: NameBn, home: HomeName } },
    );
  }
  return NextResponse.json(result);
}
