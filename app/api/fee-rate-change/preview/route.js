import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { bad } from "@/lib/validate";
import { cleanDelta, dhakaMonthIdx, planFeeChange } from "@/lib/feeRate";

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const sp = new URL(request.url).searchParams;
  const delta = cleanDelta(sp.get("delta"));
  if (delta === null) return bad("সঠিক টাকার পরিমাণ দিন");
  const includeZero = sp.get("includeZero") === "1";

  const { userCollection } = await getCollections();
  const users = await userCollection
    .find({}, { projection: { FeeRate: 1, PayMonths: 1 } })
    .toArray();
  const plan = planFeeChange(users, delta, includeZero, dhakaMonthIdx());

  const { changes, ...summary } = plan;
  return NextResponse.json({ delta, includeZero, ...summary });
}
