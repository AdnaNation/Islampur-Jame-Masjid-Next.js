import { NextResponse } from "next/server";

const LATITUDE = 22.9375;
const LONGITUDE = 91.3042;

const METHOD = 1;
const SCHOOL = 1;

export async function GET() {
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, "0")}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${today.getFullYear()}`;

  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=${METHOD}&school=${SCHOOL}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    if (data.code !== 200) {
      return NextResponse.json(
        { error: "Failed to fetch prayer times" },
        { status: 502 },
      );
    }

    const { timings, date } = data.data;

    return NextResponse.json({
      location: "Dagonbhuiyan, Feni, Bangladesh",
      date: date.readable,
      hijri: `${date.hijri.day} ${date.hijri.month.en} ${date.hijri.year}`,
      timings: {
        Fajr: timings.Fajr,
        Sunrise: timings.Sunrise,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch prayer times" },
      { status: 502 },
    );
  }
}
