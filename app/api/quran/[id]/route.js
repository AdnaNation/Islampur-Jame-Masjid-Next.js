import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id } = await params;
  const surahId = Number(id);

  if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
    return NextResponse.json({ error: "Invalid surah id" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://alquran-api.pages.dev/api/quran/surah/${surahId}?lang=bn`,
      { next: { revalidate: 604800 } },
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch surah" },
      { status: 502 },
    );
  }
}
