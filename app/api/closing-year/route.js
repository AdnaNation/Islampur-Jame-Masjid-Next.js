import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function PATCH() {
  const { userCollection } = await getCollections();
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
    return NextResponse.json({
      message: "Year closed for user!",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
