import { ObjectId, Binary } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { MAX_COLS, MAX_ROWS, MAX_TABLES } from "@/lib/noticeTable";

export async function getNoticeCollection() {
  const client = await clientPromise;
  return client.db("MosqueDB").collection("notices");
}

// attached PDF / JPG / PNG files (the income-expense report, for example)
export async function getNoticeFileCollection() {
  const client = await clientPromise;
  return client.db("MosqueDB").collection("noticeFiles");
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const isId = (v) => typeof v === "string" && /^[a-f0-9]{24}$/i.test(v);

const str = (v, max) =>
  String(v ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);

// a single table cell: plain one-line text (objects / arrays become "")
const cell = (v, max) =>
  typeof v === "string" || typeof v === "number"
    ? String(v).replace(/\s+/g, " ").trim().slice(0, max)
    : "";

export function cleanTables(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const t of input.slice(0, 30)) {
    if (out.length >= MAX_TABLES) break; // junk entries do not use up the slots
    if (!t || typeof t !== "object") continue;
    const columns = (Array.isArray(t.columns) ? t.columns : [])
      .slice(0, MAX_COLS)
      .map((c) => cell(c, 60));
    if (!columns.length) continue;
    const rows = (Array.isArray(t.rows) ? t.rows : [])
      .slice(0, MAX_ROWS)
      .map((r) =>
        columns.map((_, i) => cell(Array.isArray(r) ? r[i] : "", 200)),
      )
      .filter((r) => r.some((c) => c !== ""));
    out.push({
      title: cell(t.title, 100),
      columns,
      rows,
      showTotal: t.showTotal === true,
    });
  }
  return out;
}

// Validate + clean what the admin sends. Returns { doc, attachmentIds } or { error }.
export function cleanNotice(b = {}) {
  const title = str(b.title, 80);
  const body = str(b.body, 20000);
  const date = String(b.date || "");
  const tables = cleanTables(b.tables);
  const attachmentIds = [
    ...new Set(
      (Array.isArray(b.attachments) ? b.attachments : [])
        .map((a) => (typeof a === "string" ? a : a?.id))
        .filter(isId),
    ),
  ].slice(0, 5);

  // text, a table, or an attached file is enough
  if (!body && !tables.length && !attachmentIds.length)
    return { error: "নোটিশের লেখা, টেবিল বা সংযুক্ত ফাইল দিন" };
  if (!YMD.test(date) || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime()))
    return { error: "তারিখ সঠিক নয়" };

  const plain = body
    .replace(/\[\[table:\d+\]\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const subject = str(b.subject, 150);
  return {
    doc: {
      refNo: str(b.refNo, 40),
      date,
      title: title || "নোটিশ",
      subject,
      salutation: str(b.salutation, 120),
      body,
      tables,
      showSign: b.showSign !== false,
      excerpt: (
        plain ||
        subject ||
        (attachmentIds.length ? "সংযুক্ত ফাইল দেখুন" : "টেবিলসহ নোটিশ")
      ).slice(0, 160),
    },
    attachmentIds,
  };
}

// ---- attachments ------------------------------------------------------------
export const FILE_MAX_BYTES = 4 * 1024 * 1024; // hosting limits a request to ~4.5 MB

// Decide the type from the file's first bytes - never from the name or the browser.
export function sniffType(buf) {
  if (!buf || buf.length < 8) return null;
  if (
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46 &&
    buf[4] === 0x2d
  )
    return "application/pdf"; // %PDF-
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "image/jpeg";
  return null;
}

const EXT = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
};

export function cleanFileName(name, type) {
  const base = String(name || "")
    .split(/[\\/]/)
    .pop()
    .replace(/[\u0000-\u001f<>:"|?*]+/g, "")
    .replace(/\.[A-Za-z0-9]{1,5}$/, "") // the real extension is added from the type
    .trim()
    .slice(0, 80);
  return `${base || "file"}.${EXT[type]}`;
}

export const toBinary = (buf) => new Binary(buf);

// bytes of a stored file (MongoDB Binary -> Buffer)
export function fileBytes(data) {
  const raw = data?.buffer ?? data; // Binary -> Uint8Array
  const len = typeof data?.length === "function" ? data.length() : raw.length;
  return Buffer.from(raw.buffer, raw.byteOffset, len);
}

// What the notice stores about its files comes from the DATABASE, not from the browser.
export async function resolveAttachments(ids) {
  if (!ids?.length) return [];
  const c = await getNoticeFileCollection();
  const oids = ids.map((id) => new ObjectId(id));
  const files = await c
    .find({ _id: { $in: oids } }, { projection: { name: 1, type: 1, size: 1 } })
    .toArray();
  if (files.length) {
    await c.updateMany(
      { _id: { $in: files.map((f) => f._id) } },
      { $set: { attached: true } },
    );
  }
  const byId = new Map(files.map((f) => [String(f._id), f]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((f) => ({
      id: String(f._id),
      name: f.name,
      type: f.type,
      size: f.size,
    }));
}

export async function deleteFiles(ids) {
  const clean = (ids || []).filter(isId);
  if (!clean.length) return;
  const c = await getNoticeFileCollection();
  await c.deleteMany({ _id: { $in: clean.map((id) => new ObjectId(id)) } });
}

export { requireAdmin } from "@/lib/auth";
