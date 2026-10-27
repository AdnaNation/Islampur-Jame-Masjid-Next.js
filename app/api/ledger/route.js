import { NextResponse } from "next/server";
import { getLedger } from "@/lib/ledger";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const home = searchParams.get("home") || undefined;

  const ledger = await getLedger({ year, home });
  return NextResponse.json(ledger);
}
