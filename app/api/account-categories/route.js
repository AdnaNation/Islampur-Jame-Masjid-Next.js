import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { withIdempotency } from "@/lib/idempotency";
import { getAccountCollections, TYPES, cleanName } from "@/lib/accounts";
import { requireAdmin } from "@/lib/auth";

const byBn = (a, b) => (a || "").localeCompare(b || "", "bn");

// GET -> all categories (income first, then expense; A-Z within each)
export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { categoryCollection } = await getAccountCollections();
  const list = await categoryCollection.find({}).toArray();
  list.sort((a, b) =>
    a.type === b.type ? byBn(a.name, b.name) : a.type === "income" ? -1 : 1,
  );
  return NextResponse.json(list);
}

// POST { _id?, name, type } -> create a category
async function createCategory(request) {
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

  // the phone may send its own id (so the category is usable before it is synced)
  const wantedId =
    ObjectId.isValid(body._id) && String(body._id).length === 24
      ? new ObjectId(body._id)
      : null;
  if (wantedId) {
    const same = await categoryCollection.findOne({ _id: wantedId });
    if (same) return NextResponse.json(same); // already created: a repeat is a success
  }

  const exists = await categoryCollection.findOne(
    { type, name },
    { collation: { locale: "en", strength: 2 } }, // case-insensitive
  );
  if (exists)
    return NextResponse.json(
      { message: "এই নামে ক্যাটাগরি আগে থেকেই আছে" },
      { status: 409 },
    );

  const doc = {
    ...(wantedId ? { _id: wantedId } : {}),
    name,
    type,
    createdAt: new Date(),
  };
  const result = await categoryCollection.insertOne(doc);
  return NextResponse.json({ ...doc, _id: result.insertedId });
}

// sign-in check comes first: nobody anonymous may touch the idempotency store
export const POST = async (request) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return withIdempotency(request, () => createCategory(request));
};
