import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://alquran-api.pages.dev/api/quran", {
      next: { revalidate: 604800 },
    });
    const data = await res.json();
    return NextResponse.json(data.surahs || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch surah list" },
      { status: 502 },
    );
  }
}
