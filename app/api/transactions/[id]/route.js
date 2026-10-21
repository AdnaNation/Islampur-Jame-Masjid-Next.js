import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getAccountCollections,
  TYPES,
  dhakaStart,
  validDate,
  cleanAmount,
} from "@/lib/accounts";

export async function PATCH(request, { params }) {
  const { id } = await params;
  if (!ObjectId.isValid(id))
    return NextResponse.json({ message: "ভুল আইডি" }, { status: 400 });

  const body = await request.json();
  const { type, categoryId } = body;
  const amount = cleanAmount(body.amount);
  const date = dhakaStart(body.date);
  const note = String(body.note ?? "")
    .trim()
    .slice(0, 300);

  if (!TYPES.includes(type))
    return NextResponse.json({ message: "ধরন সঠিক নয়" }, { status: 400 });
  if (!amount)
    return NextResponse.json(
      { message: "সঠিক টাকার পরিমাণ দিন" },
      { status: 400 },
    );
  if (!validDate(date))
    return NextResponse.json({ message: "সঠিক তারিখ দিন" }, { status: 400 });
  if (!ObjectId.isValid(categoryId))
    return NextResponse.json(
      { message: "ক্যাটাগরি বেছে নিন" },
      { status: 400 },
    );

  const { transactionCollection, categoryCollection } =
    await getAccountCollections();
  const cat = await categoryCollection.findOne({
    _id: new ObjectId(categoryId),
  });
  if (!cat || cat.type !== type)
    return NextResponse.json(
      { message: "ক্যাটাগরি এই ধরনের জন্য সঠিক নয়" },
      { status: 400 },
    );

  const result = await transactionCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        type,
        categoryId: cat._id,
        categoryName: cat.name,
        amount,
        date,
        note,
        updatedAt: new Date(),
      },
    },
  );
  if (!result.matchedCount)
    return NextResponse.json(
      { message: "এন্ট্রি পাওয়া যায়নি" },
      { status: 404 },
    );
  return NextResponse.json({ updated: true });
}

// DELETE -> remove an entry
export async function DELETE(request, { params }) {
  const { id } = await params;
  if (!ObjectId.isValid(id))
    return NextResponse.json({ message: "ভুল আইডি" }, { status: 400 });
  const { transactionCollection } = await getAccountCollections();
  const result = await transactionCollection.deleteOne({
    _id: new ObjectId(id),
  });
  return NextResponse.json({ deleted: result.deletedCount });
}
