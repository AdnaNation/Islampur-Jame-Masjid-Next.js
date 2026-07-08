import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Islampur Jame Masjid is running" });
}
