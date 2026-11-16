import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { bad, isId, num, str } from "@/lib/validate";

// Edit a shopkeeper: name, phone number, monthly rent and the old due.
export async function PATCH(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!isId(id)) return bad("ভুল আইডি");

  const b = await request.json().catch(() => null);
  const NameBn = str(b?.NameBn, 100);
  const Name = str(b?.Name, 100);
  const Number = str(b?.Number, 20);
  const Rent = num(b?.Rent, 0);
  const Due = num(b?.Due);
  if (!NameBn) return bad("নাম দিন");
  if (Rent === null || Due === null) return bad("টাকার পরিমাণ সঠিক নয়");

  const { shopKeeperCollection, rentPaymentCollection } =
    await getCollections();
  const _id = new ObjectId(id);

  // two shopkeepers may not share the same Bangla name (same rule as adding)
  const clash = await shopKeeperCollection.findOne({
    NameBn,
    _id: { $ne: _id },
  });
  if (clash) return bad(`${NameBn} নামে আরেকজন আগে থেকেই আছেন`);

  const result = await shopKeeperCollection.updateOne(
    { _id },
    { $set: { NameBn, Name, Number, Rent, Due } },
  );
  if (result.matchedCount > 0) {
    // keep the name printed on old payment records in step
    await rentPaymentCollection.updateMany(
      { shopId: id },
      { $set: { name: NameBn } },
    );
  }
  return NextResponse.json(result);
}
