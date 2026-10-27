import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAccountCollections, cleanName } from "@/lib/accounts";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!ObjectId.isValid(id))
    return NextResponse.json({ message: "ভুল আইডি" }, { status: 400 });

  const body = await request.json();
  const name = cleanName(body.name);
  if (!name || name.length > 60)
    return NextResponse.json(
      { message: "ক্যাটাগরির নাম ১–৬০ অক্ষরের মধ্যে দিন" },
      { status: 400 },
    );

  const { categoryCollection, transactionCollection } =
    await getAccountCollections();
  const _id = new ObjectId(id);
  const cat = await categoryCollection.findOne({ _id });
  if (!cat)
    return NextResponse.json(
      { message: "ক্যাটাগরি পাওয়া যায়নি" },
      { status: 404 },
    );

  const dup = await categoryCollection.findOne(
    { type: cat.type, name, _id: { $ne: _id } },
    { collation: { locale: "en", strength: 2 } },
  );
  if (dup)
    return NextResponse.json(
      { message: "এই নামে ক্যাটাগরি আগে থেকেই আছে" },
      { status: 409 },
    );

  await categoryCollection.updateOne({ _id }, { $set: { name } });
  await transactionCollection.updateMany(
    { categoryId: _id },
    { $set: { categoryName: name } },
  );
  return NextResponse.json({ ...cat, name });
}

export async function DELETE(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!ObjectId.isValid(id))
    return NextResponse.json({ message: "ভুল আইডি" }, { status: 400 });

  const { categoryCollection, transactionCollection } =
    await getAccountCollections();
  const _id = new ObjectId(id);
  const used = await transactionCollection.countDocuments({ categoryId: _id });
  if (used > 0)
    return NextResponse.json(
      {
        message: `এই ক্যাটাগরিতে ${used} টি এন্ট্রি আছে, তাই মুছা যাবে না। আগে সেগুলো মুছুন বা অন্য ক্যাটাগরিতে নিন।`,
      },
      { status: 409 },
    );
  const result = await categoryCollection.deleteOne({ _id });
  return NextResponse.json({ deleted: result.deletedCount });
}
