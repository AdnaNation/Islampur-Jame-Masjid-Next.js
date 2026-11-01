import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

const timeOf = (m) => m?.updatedAt || m?.createdAtDhaka || m?.createdAt || "";

const slim = (m) => ({
  messageId: m?.messageId || "",
  text: m?.text || "",
  type: m?.type || "text",
  from: m?.from || "user",
  mediaId: m?.mediaId || null,
  updatedAt: timeOf(m),
});

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const waId = searchParams.get("waId");
  const { messageCollection } = await getCollections();

  if (waId) {
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
    const [doc] = await messageCollection
      .aggregate([
        { $match: { waId } },
        {
          $project: {
            waId: 1,
            name: 1,
            botStatus: 1,
            botPausedUntil: 1,
            total: { $size: { $ifNull: ["$messages", []] } },
            messages: { $slice: [{ $ifNull: ["$messages", []] }, -limit] },
          },
        },
      ])
      .toArray();
    if (!doc)
      return NextResponse.json({
        waId,
        name: "",
        total: 0,
        messages: [],
        botStatus: "bot",
      });
    return NextResponse.json({
      waId: doc.waId,
      name: doc.name || "",
      botStatus: doc.botStatus || "bot",
      botPausedUntil: doc.botPausedUntil || null,
      total: doc.total,
      messages: (doc.messages || []).map(slim),
    });
  }
  const docs = await messageCollection
    .aggregate([
      {
        $project: {
          waId: 1,
          name: 1,
          total: { $size: { $ifNull: ["$messages", []] } },
          last: { $arrayElemAt: [{ $ifNull: ["$messages", []] }, -1] },
        },
      },
      { $sort: { "last.updatedAt": -1, _id: -1 } },
    ])
    .toArray();

  return NextResponse.json(
    docs.map((d) => ({
      waId: d.waId,
      name: d.name || "",
      total: d.total,
      last: slim(d.last),
    })),
  );
}

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { waId, text } = await request.json();
  if (!waId || !text)
    return NextResponse.json(
      { error: "waId and text required" },
      { status: 400 },
    );

  const { messageCollection } = await getCollections();

  // Send via WhatsApp API
  const res = await fetch(
    `https://graph.facebook.com/v26.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: waId,
        type: "text",
        text: { body: text.slice(0, 4000) },
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 400 });
  }

  // Save your manual reply + pause bot for 2 hours
  const now = new Date();
  await messageCollection.updateOne(
    { waId },
    {
      $set: {
        botStatus: "human",
        botPausedUntil: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
      },
      $push: {
        messages: {
          messageId: `human_${Date.now()}`,
          text,
          type: "text",
          from: "me",
          updatedAt: now,
        },
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}

// Add this to resume bot
export async function PUT(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { waId, action } = await request.json();
  const { messageCollection } = await getCollections();
  if (action === "resume") {
    await messageCollection.updateOne(
      { waId },
      { $set: { botStatus: "bot", botPausedUntil: null } },
    );
  } else if (action === "pause") {
    await messageCollection.updateOne(
      { waId },
      {
        $set: {
          botStatus: "human",
          botPausedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      },
    );
  }
  return NextResponse.json({ ok: true });
}
