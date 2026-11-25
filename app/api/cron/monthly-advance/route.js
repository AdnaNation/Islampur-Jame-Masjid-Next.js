import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getCollections } from "@/lib/mongodb";
import { planMonthlyAdvanceUse } from "@/lib/advance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dhakaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
}

async function runMonthlyAdvance(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, month, day } = dhakaDateParts();
  if (day !== 1) {
    return NextResponse.json({ success: true, skipped: true, reason: "Not the first day in Asia/Dhaka" });
  }

  const monthName = MONTHS[month - 1];
  const { userCollection, advanceUseCollection } = await getCollections();
  const holders = await userCollection
    .find({ Advance: { $gt: 0 } }, { projection: { _id: 1 } })
    .toArray();

  const client = await clientPromise;
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const holder of holders) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const useId = `monthly:${year}:${month}:${String(holder._id)}`;
        const alreadyApplied = await advanceUseCollection.findOne({ _id: useId }, { session });
        if (alreadyApplied) {
          skipped += 1;
          return;
        }

        const user = await userCollection.findOne({ _id: holder._id }, { session });
        if (!user) {
          skipped += 1;
          return;
        }
        const plan = planMonthlyAdvanceUse(user, monthName);
        if (!plan) {
          skipped += 1;
          return;
        }

        const nextPayMonths = (user.PayMonths || []).map((item) =>
          item.monthName === monthName
            ? { ...item, paidAmount: plan.paidAmount, status: plan.monthStatus }
            : item,
        );
        const updated = await userCollection.updateOne(
          { _id: holder._id, Advance: user.Advance },
          {
            $set: {
              Advance: plan.newAdvance,
              AdvanceLots: plan.advanceLots,
              PayMonths: nextPayMonths,
            },
          },
          { session },
        );
        if (!updated.modifiedCount) throw new Error("Member changed during monthly advance allocation");

        await advanceUseCollection.insertOne({
          _id: useId,
          userId: String(holder._id),
          name: user.NameBn || user.Name || "",
          year,
          month: monthName,
          months: [monthName],
          monthsUsed: plan.used,
          dueUsed: 0,
          source: "monthly-cron",
          advanceLeft: plan.newAdvance,
          lotUses: plan.lotUses,
          at: new Date(),
        }, { session });
        processed += 1;
      });
    } catch (error) {
      failed += 1;
      console.error("Monthly advance allocation failed for member:", String(holder._id), error);
    } finally {
      await session.endSession();
    }
  }

  return NextResponse.json({
    success: failed === 0,
    year,
    month: monthName,
    processed,
    skipped,
    failed,
  }, { status: failed ? 207 : 200 });
}

export const GET = runMonthlyAdvance;
export const POST = runMonthlyAdvance;
