import { NextResponse } from "next/server";
import { withIdempotency } from "@/lib/idempotency";
import {
  cleanNotice,
  getNoticeCollection,
  requireAdmin,
  resolveAttachments,
} from "@/lib/notices";

export const dynamic = "force-dynamic";

// GET /api/notices?limit=3 -> newest first, without the long body (public)
export async function GET(request) {
  const limit = Math.min(
    100,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 50),
  );
  const c = await getNoticeCollection();
  const list = await c
    .find({}, { projection: { body: 0, salutation: 0, tables: 0 } })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .toArray();
  return NextResponse.json(list);
}

async function create(request) {
  const { doc, attachmentIds, error } = cleanNotice(
    await request.json().catch(() => ({})),
  );
  if (error) return NextResponse.json({ message: error }, { status: 400 });
  const attachments = await resolveAttachments(attachmentIds);
  const c = await getNoticeCollection();
  const now = new Date();
  const full = { ...doc, attachments, createdAt: now, updatedAt: now };
  const r = await c.insertOne(full);
  return NextResponse.json({ ...full, _id: r.insertedId });
}

// sign-in check comes first: nobody anonymous may touch the idempotency store
export const POST = async (request) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return withIdempotency(request, () => create(request));
};
