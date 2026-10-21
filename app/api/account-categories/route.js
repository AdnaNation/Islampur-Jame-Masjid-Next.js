import { NextResponse } from "next/server";
import { getAccountCollections, TYPES, cleanName } from "@/lib/accounts";

const byBn = (a, b) => (a || "").localeCompare(b || "", "bn");

export async function GET() {
  const { categoryCollection } = await getAccountCollections();
  const list = await categoryCollection.find({}).toArray();
  list.sort((a, b) =>
    a.type === b.type ? byBn(a.name, b.name) : a.type === "income" ? -1 : 1,
  );
  return NextResponse.json(list);
}

export async function POST(request) {
  const body = await request.json();
  const name = cleanName(body.name);
  const type = body.type;

  if (!TYPES.includes(type))
    return NextResponse.json({ message: "ধরন সঠিক নয়" }, { status: 400 });
  if (!name || name.length > 60)
    return NextResponse.json(
      { message: "ক্যাটাগরির নাম ১–৬০ অক্ষরের মধ্যে দিন" },
      { status: 400 },
    );

  const { categoryCollection } = await getAccountCollections();
  const exists = await categoryCollection.findOne(
    { type, name },
    { collation: { locale: "en", strength: 2 } },
  );
  if (exists)
    return NextResponse.json(
      { message: "এই নামে ক্যাটাগরি আগে থেকেই আছে" },
      { status: 409 },
    );

  const doc = { name, type, createdAt: new Date() };
  const result = await categoryCollection.insertOne(doc);
  return NextResponse.json({ ...doc, _id: result.insertedId });
}
