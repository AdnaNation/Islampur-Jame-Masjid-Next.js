import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  cleanNotice,
  deleteFiles,
  getNoticeCollection,
  requireAdmin,
  resolveAttachments,
} from "@/lib/notices";

export const dynamic = "force-dynamic";

const badId = () => NextResponse.json({ message: "ভুল আইডি" }, { status: 400 });
const notFound = () =>
  NextResponse.json({ message: "নোটিশ পাওয়া যায়নি" }, { status: 404 });

const idsOf = (n) => (n?.attachments || []).map((a) => a.id);

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
  const { doc, attachmentIds, error } = cleanNotice(
    await request.json().catch(() => ({})),
  );
  if (error) return NextResponse.json({ message: error }, { status: 400 });

  const c = await getNoticeCollection();
  const before = await c.findOne({ _id: new ObjectId(id) });
  if (!before) return notFound();

  const attachments = await resolveAttachments(attachmentIds);
  const r = await c.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...doc, attachments, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!r) return notFound();

  // files the admin removed from this notice are deleted for good
  const keep = new Set(attachments.map((a) => a.id));
  await deleteFiles(idsOf(before).filter((fid) => !keep.has(fid)));
  return NextResponse.json(r);
}

export async function DELETE(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!ObjectId.isValid(id)) return badId();
  const c = await getNoticeCollection();
  const gone = await c.findOneAndDelete({ _id: new ObjectId(id) });
  if (!gone) return notFound();
  await deleteFiles(idsOf(gone));
  return NextResponse.json({ ok: true });
}
