import { NextResponse } from "next/server";
import {
  FILE_MAX_BYTES,
  cleanFileName,
  getNoticeFileCollection,
  requireAdmin,
  sniffType,
  toBinary,
} from "@/lib/notices";

export const dynamic = "force-dynamic";

const fail = (message, status = 400) =>
  NextResponse.json({ message }, { status });

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let form;
  try {
    form = await request.formData();
  } catch {
    return fail("ফাইলটি পড়া যায়নি");
  }
  const file = form.get("file");
  if (
    !file ||
    typeof file === "string" ||
    typeof file.arrayBuffer !== "function"
  )
    return fail("একটি ফাইল বেছে নিন");
  if (file.size > FILE_MAX_BYTES)
    return fail(
      "ফাইল ৪ MB-এর বেশি হতে পারবে না (JPG ব্যবহার করলে ছোট হয়)",
      413,
    );

  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffType(buf);
  if (!type) return fail("শুধু PDF, JPG বা PNG ফাইল দেওয়া যাবে");

  const c = await getNoticeFileCollection();
  const name = cleanFileName(file.name, type);
  const r = await c.insertOne({
    name,
    type,
    size: buf.length,
    data: toBinary(buf),
    attached: false,
    createdAt: new Date(),
  });

  // tidy up: files uploaded more than a week ago and never attached to a notice
  c.deleteMany({
    attached: false,
    createdAt: { $lt: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
  }).catch(() => {});

  return NextResponse.json({
    id: String(r.insertedId),
    name,
    type,
    size: buf.length,
  });
}
