import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { userCollection } = await getCollections();
  const pipeline = [
    {
      $addFields: {
        feeRateAsNumber: { $toDouble: "$FeeRate" },
        paidMonthValue: {
          $sum: {
            $map: {
              input: { $ifNull: ["$PayMonths", []] },
              as: "month",
              in: {
                $cond: [
                  { $eq: ["$month.status", "paid"] },
                  { $toDouble: "$FeeRate" },
                  {
                    $cond: [
                      { $eq: ["$month.status", "partial"] },
                      { $convert: { input: "$month.paidAmount", to: "double", onError: 0, onNull: 0 } },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        totalPaidByUser: "$paidMonthValue",
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$totalPaidByUser" },
      },
    },
  ];
  const result = await userCollection.aggregate(pipeline).toArray();
  return NextResponse.json(result);
}
