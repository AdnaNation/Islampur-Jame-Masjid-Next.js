import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

const timeOf = (m) => m?.updatedAt || m?.createdAtDhaka || m?.createdAt || "";

const slim = (m) => ({
  messageId: m?.messageId || "",
  text: m?.text || "",
  type: m?.type || "text",
  updatedAt: timeOf(m),
});

export async function GET(request) {
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
            total: { $size: { $ifNull: ["$messages", []] } },
            messages: { $slice: [{ $ifNull: ["$messages", []] }, -limit] },
          },
        },
      ])
      .toArray();
    if (!doc)
      return NextResponse.json({ waId, name: "", total: 0, messages: [] });
    return NextResponse.json({
      waId: doc.waId,
      name: doc.name || "",
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
