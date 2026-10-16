import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getCollections } from "@/lib/mongodb";
import { getLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export async function GET(request) {
  // admin only: valid JWT + the number must be an admin in the DB
  const auth = verifyToken(request);
  if (auth instanceof NextResponse) return auth;

  const { adminCollection } = await getCollections();
  const admin = await adminCollection.findOne({ number: auth.number });
  if (!admin?.admin) {
    return NextResponse.json({ message: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const home = searchParams.get("home") || undefined;

  const ledger = await getLedger({ year, home });
  return NextResponse.json(ledger);
}
