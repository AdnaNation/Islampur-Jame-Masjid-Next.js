// import { NextResponse } from "next/server";

// const LATITUDE = 22.9375;
// const LONGITUDE = 91.3042;

// const METHOD = 1;
// const SCHOOL = 1;

// export async function GET() {
//   const today = new Date();
//   const dateStr = `${String(today.getDate()).padStart(2, "0")}-${String(
//     today.getMonth() + 1,
//   ).padStart(2, "0")}-${today.getFullYear()}`;

//   const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=${METHOD}&school=${SCHOOL}`;

//   try {
//     const res = await fetch(url, {
//       next: { revalidate: 3600 },
//     });
//     const data = await res.json();

//     if (data.code !== 200) {
//       return NextResponse.json(
//         { error: "Failed to fetch prayer times" },
//         { status: 502 },
//       );
//     }

//     const { timings, date } = data.data;

//     return NextResponse.json({
//       location: "Dagonbhuiyan, Feni, Bangladesh",
//       date: date.readable,
//       hijri: `${date.hijri.day} ${date.hijri.month.en} ${date.hijri.year}`,
//       timings: {
//         Fajr: timings.Fajr,
//         Sunrise: timings.Sunrise,
//         Dhuhr: timings.Dhuhr,
//         Asr: timings.Asr,
//         Maghrib: timings.Maghrib,
//         Isha: timings.Isha,
//       },
//     });
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to fetch prayer times" },
//       { status: 502 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const LATITUDE = 22.9375;
const LONGITUDE = 91.3042;
const METHOD = 1;
const SCHOOL = 1;

// set manually by admin
const MANUAL_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour HH:mm
const DOC_ID = "prayer-times";

/**
 * TODO: replace with your real server-side admin check.
 * It must return the user's email/id if they are an admin, otherwise null.
 * See the examples below the code.
 */
async function getAdminUser(request) {
  return null; // locked by default: nobody can save until you implement this
}

async function fetchAladhan() {
  // use Bangladesh date, not the server's (Vercel runs in UTC)
  const dateStr = new Date()
    .toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" }) // dd/mm/yyyy
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
      // Sunrise always comes from the API
      Sunrise: api?.timings?.Sunrise?.slice(0, 5) ?? null,
    };
    for (const key of MANUAL_KEYS) {
      timings[key] = savedTimings[key] || null; // null = not set yet
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

export async function PUT(request) {
  const body = await request.json().catch(() => null);
  const input = body?.timings;
  if (!input || typeof input !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const timings = {};
  for (const key of MANUAL_KEYS) {
    const value = input[key];
    if (value === "" || value == null) continue; // leave unset
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
