import clientPromise from "@/lib/mongodb";

export async function getNoticeCollection() {
  const client = await clientPromise;
  return client.db("MosqueDB").collection("notices");
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, max) =>
  String(v ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);

// Validate + clean what the admin sends. Returns { doc } or { error }.
export function cleanNotice(b = {}) {
  const title = str(b.title, 80);
  const body = str(b.body, 20000);
  const date = String(b.date || "");
  if (!body) return { error: "নোটিশের লেখা খালি রাখা যাবে না" };
  if (!YMD.test(date) || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime()))
    return { error: "তারিখ সঠিক নয়" };
  return {
    doc: {
      refNo: str(b.refNo, 40),
      date,
      title: title || "নোটিশ",
      subject: str(b.subject, 150),
      salutation: str(b.salutation, 120),
      body,
      showSign: b.showSign !== false,
      excerpt: body.replace(/\s+/g, " ").slice(0, 160),
    },
  };
}

export { requireAdmin } from "@/lib/auth";
