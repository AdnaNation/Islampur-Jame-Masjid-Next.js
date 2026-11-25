import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import clientPromise from "@/lib/mongodb";
import { planAdvanceUse } from "@/lib/advance";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const {
    userCollection,
    shopKeeperCollection,
    lastClosingCollection,
    advanceUseCollection,
  } = await getCollections();
  try {
    const last = await lastClosingCollection.findOne(
      {},
      { projection: { lastSendingYear: 1, _id: 0 } },
    );
    const closingYear = Number(last?.lastSendingYear) + 1;
    if (!Number.isInteger(closingYear)) {
      return NextResponse.json({ error: "বছর বন্ধের তথ্য পাওয়া যায়নি" }, { status: 409 });
    }

    const result = await userCollection.updateMany({ closedYear: { $ne: closingYear } }, [
      {
        $set: {
          unpaidCount: {
            $reduce: {
              input: { $ifNull: ["$PayMonths", []] },
              initialValue: 0,
              in: {
                $add: [
                  "$value",
                  {
                    $cond: [
                      { $eq: ["$this.status", "unpaid"] },
                      1,
                      {
                        $cond: [
                          { $eq: ["$this.status", "partial"] },
                          {
                            $cond: [
                              { $gt: [{ $toDouble: "$FeeRate" }, 0] },
                              {
                                $divide: [
                                  {
                                    $max: [
                                      0,
                                      {
                                        $subtract: [
                                          { $toDouble: "$FeeRate" },
                                          { $convert: { input: "$this.paidAmount", to: "double", onError: 0, onNull: 0 } },
                                        ],
                                      },
                                    ],
                                  },
                                  { $toDouble: "$FeeRate" },
                                ],
                              },
                              0,
                            ],
                          },
                          0,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $set: {
          prevYear: {
            PayMonths: "$PayMonths",
            Tarabi: "$Tarabi",
            FeeRate: "$FeeRate",
            Due: {
              $add: [
                {
                  $cond: [
                    { $ne: ["$Tarabi.status", "paid"] },
                    { $max: [0, { $subtract: [
                      { $convert: { input: "$Tarabi.fee", to: "double", onError: 0, onNull: 0 } },
                      { $convert: { input: "$Tarabi.paidAmount", to: "double", onError: 0, onNull: 0 } },
                    ] }] },
                    0,
                  ],
                },
                {
                  $multiply: [{ $toDouble: "$FeeRate" }, "$unpaidCount"],
                },
                { $toDouble: "$Due" },
              ],
            },
          },
        },
      },
      {
        $set: {
          Due: {
            $add: [
              {
                $cond: [
                  { $ne: ["$Tarabi.status", "paid"] },
                    { $max: [0, { $subtract: [
                      { $convert: { input: "$Tarabi.fee", to: "double", onError: 0, onNull: 0 } },
                      { $convert: { input: "$Tarabi.paidAmount", to: "double", onError: 0, onNull: 0 } },
                    ] }] },
                    0,
                ],
              },
              {
                $multiply: [{ $toDouble: "$FeeRate" }, "$unpaidCount"],
              },
              { $toDouble: "$Due" },
            ],
          },
        },
      },
      {
        $set: {
          PayMonths: {
            $map: {
              input: "$PayMonths",
              as: "month",
              in: {
                monthName: "$$month.monthName",
                status: "unpaid",
              },
            },
          },
          "Tarabi.status": "unpaid",
          "Tarabi.paidAmount": 0,
          closedYear: closingYear,
        },
      },
      { $unset: "unpaidCount" },
    ]);

    let advanceUsed = 0;
    let advanceFailed = false;
    try {
      const holders = await userCollection
        .find({ Advance: { $gt: 0 } }, { projection: { _id: 1 } })
        .toArray();
      const client = await clientPromise;
      for (const holder of holders) {
        const session = client.startSession();
        try {
          await session.withTransaction(async () => {
            const useId = `${closingYear + 1}:${String(holder._id)}`;
            const existing = await advanceUseCollection.findOne(
              { _id: useId },
              { session },
            );
            if (existing) return;

            const current = await userCollection.findOne(
              { _id: holder._id },
              { session },
            );
            if (!current || !(Number(current.Advance) > 0)) return;

            const plan = planAdvanceUse(current) || {
              dueUsed: 0,
              months: [],
              monthsUsed: 0,
              newDue: Number(current.Due) || 0,
              newAdvance: Number(current.Advance) || 0,
            };
            const paidMonths = new Set(plan.months);
            const nextPayMonths = (current.PayMonths || []).map((month) => ({
              ...month,
              status: paidMonths.has(month.monthName) ? "paid" : month.status,
            }));

            const updated = await userCollection.updateOne(
              {
                _id: holder._id,
                Advance: current.Advance,
                Due: current.Due,
                FeeRate: current.FeeRate,
                lastAdvanceCloseYear: { $ne: closingYear },
              },
              {
                $set: {
                  Advance: plan.newAdvance,
                  AdvanceLots: plan.advanceLots,
                  Due: plan.newDue,
                  PayMonths: nextPayMonths,
                  lastAdvanceCloseYear: closingYear,
                },
              },
              { session },
            );
            if (!updated.modifiedCount) {
              const error = new Error("Member changed during advance allocation");
              error.transient = true;
              throw error;
            }

            await advanceUseCollection.insertOne(
              {
                _id: useId,
                userId: String(holder._id),
                name: current.NameBn || current.Name || "",
                year: closingYear + 1,
                closingYear,
                source: "year-close",
                dueUsed: plan.dueUsed,
                months: plan.months,
                monthsUsed: plan.monthsUsed,
                advanceLeft: plan.newAdvance,
                lotUses: plan.lotUses,
                at: new Date(),
              },
              { session },
            );
            advanceUsed += 1;
          });
        } finally {
          await session.endSession();
        }
      }
    } catch (advErr) {
      advanceFailed = true;
      console.error("closing-year (advance) failed:", advErr);
    }

    let shopsClosed = 0;
    let shopsFailed = false;
    try {
      const toNum = (field) => ({
        $convert: { input: field, to: "double", onError: 0, onNull: 0 },
      });
      const shops = await shopKeeperCollection.updateMany(
        { closedYear: { $ne: closingYear } },
        [
          {
            $set: {
              unpaidCount: {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$PayMonths", []] },
                    as: "m",
                    cond: { $eq: ["$$m.status", "unpaid"] },
                  },
                },
              },
            },
          },
          {
            $set: {
              carry: {
                $add: [
                  { $multiply: [toNum("$Rent"), "$unpaidCount"] },
                  toNum("$Due"),
                ],
              },
            },
          },
          {
            $set: {
              prevYear: {
                PayMonths: "$PayMonths",
                Rent: "$Rent",
                Due: "$carry",
              },
              Due: "$carry",
              closedYear: closingYear,
            },
          },
          {
            $set: {
              PayMonths: {
                $map: {
                  input: { $ifNull: ["$PayMonths", []] },
                  as: "month",
                  in: { monthName: "$$month.monthName", status: "unpaid" },
                },
              },
            },
          },
          { $unset: ["unpaidCount", "carry"] },
        ],
      );
      shopsClosed = shops.modifiedCount;
    } catch (shopErr) {
      shopsFailed = true;
      console.error("closing-year (shop rent) failed:", shopErr);
    }

    return NextResponse.json({
      message: "Year closed for user!",
      modifiedCount: result.modifiedCount,
      shopsClosed,
      shopsFailed,
      advanceUsed,
      advanceFailed,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
