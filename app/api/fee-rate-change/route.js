import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { adminSession, requireAdmin } from "@/lib/auth";
import { withIdempotency } from "@/lib/idempotency";
import { bad } from "@/lib/validate";
import { cleanDelta, dhakaMonthIdx, planFeeChange } from "@/lib/feeRate";

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { feeRateChangeCollection } = await getCollections();
  const list = await feeRateChangeCollection
    .find({}, { projection: { changes: 0 } })
    .sort({ at: -1 })
    .limit(10)
    .toArray();
  return NextResponse.json(list);
}

async function applyChange(request, by) {
  const body = await request.json().catch(() => null);
  const delta = cleanDelta(body?.delta);
  if (delta === null) return bad("সঠিক টাকার পরিমাণ দিন");
  const includeZero = body?.includeZero === true;

  const { userCollection, feeRateChangeCollection } = await getCollections();
  const users = await userCollection
    .find({}, { projection: { FeeRate: 1, PayMonths: 1 } })
    .toArray();
  const plan = planFeeChange(users, delta, includeZero, dhakaMonthIdx());

  if (plan.affected === 0) return bad("কোনো সদস্যের হার বদলাবে না");

  if (Number(body?.expectedAffected) !== plan.affected)
    return bad("সদস্যদের তথ্য বদলে গেছে — আবার প্রিভিউ দেখে নিশ্চিত করুন");

  const result = await userCollection.bulkWrite(
    plan.changes.map((c) => ({
      updateOne: {
        filter: { _id: c._id, FeeRate: c.rawFrom ?? null },
        update: { $set: { FeeRate: c.to } },
      },
    })),
    { ordered: false },
  );

  const doc = {
    at: new Date(),
    by,
    delta,
    includeZero,
    planned: plan.affected,
    affected: result.modifiedCount,
    skippedZero: plan.skippedZero,
    dueShift: plan.dueShift,
    groups: plan.groups.slice(0, 8),

    changes: plan.changes.map((c) => ({
      id: String(c._id),
      from: c.from,
      to: c.to,
    })),
    reverted: false,
  };
  const saved = await feeRateChangeCollection.insertOne(doc);
  return NextResponse.json({
    success: true,
    logId: saved.insertedId,
    affected: result.modifiedCount,
    planned: plan.affected,
  });
}

export const POST = async (request) => {
  const { session, error } = await adminSession(request);
  if (error) return error;
  return withIdempotency(request, () => applyChange(request, session.number));
};
