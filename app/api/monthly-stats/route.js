import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET() {
  const { userCollection } = await getCollections();
  const pipeline = [
    {
      $addFields: {
        feeRateAsNumber: { $toDouble: "$FeeRate" },
        paidMonthCount: {
          $size: {
            $filter: {
              input: "$PayMonths",
              as: "month",
              cond: { $eq: ["$$month.status", "paid"] },
            },
          },
        },
      },
    },
    {
      $addFields: {
        totalPaidByUser: {
          $multiply: ["$feeRateAsNumber", "$paidMonthCount"],
        },
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
