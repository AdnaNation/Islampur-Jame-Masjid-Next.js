import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });

  // Step 1: Get media URL from Facebook
  const metaRes = await fetch(`https://graph.facebook.com/v26.0/${id}`, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
  });
  const meta = await metaRes.json();
  if (!meta.url)
    return NextResponse.json({ error: "no url", meta }, { status: 400 });

  // Step 2: Download the actual file
  const fileRes = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
  });
  const buffer = await fileRes.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": fileRes.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
