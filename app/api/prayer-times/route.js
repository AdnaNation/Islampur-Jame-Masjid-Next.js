import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireStaff } from "@/lib/auth";
import { getPrayerTimes, MANUAL_KEYS, PRAYER_DOC_ID } from "@/lib/publicData";

export const dynamic = "force-dynamic";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour HH:mm

export async function GET() {
  try {
    return NextResponse.json(await getPrayerTimes());
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch prayer times" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  const denied = await requireStaff(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  const input = body?.timings;
  if (!input || typeof input !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const timings = {};
  for (const key of MANUAL_KEYS) {
    const value = input[key];
    if (value === "" || value == null) continue;
    if (!TIME_RE.test(value)) {
      return NextResponse.json(
        { error: `Invalid time for ${key}` },
        { status: 400 },
      );
    }
    timings[key] = value;
  }

  const { prayerTimeCollection } = await getCollections();
  await prayerTimeCollection.updateOne(
    { _id: PRAYER_DOC_ID },
    {
      $set: {
        timings,
        updatedAt: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Dhaka",
        }),
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}
