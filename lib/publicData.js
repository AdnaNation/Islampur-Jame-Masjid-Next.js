import { cache } from "react";
import { ObjectId } from "mongodb";
import clientPromise, { getCollections } from "@/lib/mongodb";

const plain = (v) => JSON.parse(JSON.stringify(v));

async function noticesCollection() {
  const client = await clientPromise;
  return client.db("MosqueDB").collection("notices");
}

export async function getNoticeList(limit = 50) {
  try {
    const c = await noticesCollection();
    const list = await c
      .find({}, { projection: { body: 0, salutation: 0, tables: 0 } })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .toArray();
    return plain(list);
  } catch (e) {
    console.error("getNoticeList failed:", e?.message);
    return [];
  }
}

export const getNotice = cache(async (id) => {
  if (!/^[a-f0-9]{24}$/i.test(String(id))) return null;
  const c = await noticesCollection();
  const n = await c.findOne({ _id: new ObjectId(id) });
  return n ? plain(n) : null;
});

const LATITUDE = 22.893773;
const LONGITUDE = 91.260654;
const METHOD = 1;
const SCHOOL = 1;
export const MANUAL_KEYS = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
  "Jummah",
];
export const PRAYER_DOC_ID = "prayer-times";

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

export async function getPrayerTimes() {
  const { prayerTimeCollection } = await getCollections();
  const [saved, api] = await Promise.all([
    prayerTimeCollection.findOne({ _id: PRAYER_DOC_ID }),
    fetchAladhan(),
  ]);
  const savedTimings = saved?.timings || {};
  const timings = {
    Sunrise: api?.timings?.Sunrise?.slice(0, 5) ?? null,
    Sunset: api?.timings?.Sunset?.slice(0, 5) ?? null,
  };
  for (const key of MANUAL_KEYS) timings[key] = savedTimings[key] || null;

  return {
    location: "Dagonbhuiyan, Feni, Bangladesh",
    date: api?.date?.readable ?? "",
    hijri: api
      ? `${api.date.hijri.day} ${api.date.hijri.month.en} ${api.date.hijri.year}`
      : "",
    timings,
    updatedAt: saved?.updatedAt,
  };
}
