import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

const LATITUDE = 22.9375;
const LONGITUDE = 91.3042;
const METHOD = 1;
const SCHOOL = 1;

// set manually by admin
const MANUAL_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Jummah"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour HH:mm
const DOC_ID = "prayer-times";

async function fetchAladhan() {
  const dateStr = new Date()
    .toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" })
    .replaceAll("/", "-");

  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=${METHOD}&school=${SCHOOL}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    if (json.code !== 200) return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const { prayerTimeCollection } = await getCollections();
    const [saved, api] = await Promise.all([
      prayerTimeCollection.findOne({ _id: DOC_ID }),
      fetchAladhan(),
    ]);
    const savedTimings = saved?.timings || {};

    const timings = {
      Sunrise: api?.timings?.Sunrise?.slice(0, 5) ?? null,
      Sunset: api?.timings?.Sunset?.slice(0, 5) ?? null,
    };
    for (const key of MANUAL_KEYS) {
      timings[key] = savedTimings[key] || null;
    }

    return NextResponse.json({
      location: "Dagonbhuiyan, Feni, Bangladesh",
      date: api?.date?.readable ?? "",
      hijri: api
        ? `${api.date.hijri.day} ${api.date.hijri.month.en} ${api.date.hijri.year}`
        : "",
      timings,
      updatedAt: saved?.updatedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch prayer times" },
      { status: 500 },
    );
  }
}

// admin or moderator only (this used to be open to everyone)
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
    { _id: DOC_ID },
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
