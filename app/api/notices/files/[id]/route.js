import { ObjectId } from "mongodb";
import { fileBytes, getNoticeFileCollection } from "@/lib/notices";

export const dynamic = "force-dynamic";

const missing = () =>
  new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });

// Images open in the page; a PDF always downloads.
export async function GET(request, { params }) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) return missing();

  let f;
  try {
    const c = await getNoticeFileCollection();
    f = await c.findOne({ _id: new ObjectId(id) });
  } catch (e) {
    console.error("notice file read failed:", e?.message);
    return new Response("Server error", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!f) return missing();

  const bytes = fileBytes(f.data);
  const isPdf = f.type === "application/pdf";
  return new Response(bytes, {
    headers: {
      "Content-Type": f.type, // from the stored, verified type
      "Content-Length": String(bytes.length),
      "Content-Disposition": `${isPdf ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(f.name || "file")}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
