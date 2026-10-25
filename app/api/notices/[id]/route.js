import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cleanNotice, getNoticeCollection, requireAdmin } from "@/lib/notices";

export const dynamic = "force-dynamic";

const badId = () => NextResponse.json({ message: "ভুল আইডি" }, { status: 400 });
const notFound = () =>
  NextResponse.json({ message: "নোটিশ পাওয়া যায়নি" }, { status: 404 });

export async function GET(request, { params }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return badId();
  const c = await getNoticeCollection();
  const n = await c.findOne({ _id: new ObjectId(id) });
  return n ? NextResponse.json(n) : notFound();
}

export async function PATCH(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!ObjectId.isValid(id)) return badId();
  const { doc, error } = cleanNotice(await request.json());
  if (error) return NextResponse.json({ message: error }, { status: 400 });
  const c = await getNoticeCollection();
  const r = await c.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...doc, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return r ? NextResponse.json(r) : notFound();
}

export async function DELETE(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!ObjectId.isValid(id)) return badId();
  const c = await getNoticeCollection();
  const r = await c.deleteOne({ _id: new ObjectId(id) });
  return r.deletedCount ? NextResponse.json({ ok: true }) : notFound();
}
