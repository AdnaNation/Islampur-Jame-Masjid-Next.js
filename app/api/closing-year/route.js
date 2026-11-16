import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { userCollection, shopKeeperCollection, lastClosingCollection } =
    await getCollections();
  try {
    const result = await userCollection.updateMany({}, [
      {
        $set: {
          unpaidCount: {
            $size: {
              $filter: {
                input: "$PayMonths",
                as: "m",
                cond: { $eq: ["$$m.status", "unpaid"] },
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
                    { $eq: ["$Tarabi.status", "unpaid"] },
                    { $toDouble: "$Tarabi.fee" },
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
                  { $eq: ["$Tarabi.status", "unpaid"] },
                  { $toDouble: "$Tarabi.fee" },
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
        },
      },
      { $unset: "unpaidCount" },
    ]);

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let shopsClosed = 0;
    let shopsFailed = false;
    try {
      const last = await lastClosingCollection.findOne(
        {},
        { projection: { lastSendingYear: 1, _id: 0 } },
      );
      const closingYear = Number(last?.lastSendingYear) + 1;
      if (!Number.isInteger(closingYear))
        throw new Error("closing year unknown");

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
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
