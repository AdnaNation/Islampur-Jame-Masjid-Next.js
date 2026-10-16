import { NextResponse } from "next/server";
import { getLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const home = searchParams.get("home") || undefined;

  const ledger = await getLedger({ year, home });
  return NextResponse.json(ledger);
}
