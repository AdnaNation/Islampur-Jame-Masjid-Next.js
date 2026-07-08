import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET() {
  const { userCollection } = await getCollections();
  const pipeline = [
    {
      $match: {
        "Tarabi.status": "paid",
      },
    },
    {
      $addFields: {
        feeAsNumber: { $toDouble: "$Tarabi.fee" },
      },
    },
    {
      $group: {
        _id: null,
        totalPaidUsers: { $sum: 1 },
        totalAmount: { $sum: "$feeAsNumber" },
      },
    },
  ];
  const pipeline2 = [
    {
      $match: {
        "Tarabi.status": "unpaid",
      },
    },
    {
      $addFields: {
        feeAsNumber: { $toDouble: "$Tarabi.fee" },
      },
    },
    {
      $group: {
        _id: null,
        totalUnpaidUsers: { $sum: 1 },
        totalUnpaidAmount: { $sum: "$feeAsNumber" },
      },
    },
  ];
  const result = await userCollection.aggregate(pipeline).toArray();
  const result2 = await userCollection.aggregate(pipeline2).toArray();
  if (result.length === 0) {
    return NextResponse.json({
      paidStats: {
        totalPaidUsers: 0,
        totalAmount: 0,
      },
      unpaidStats: {
        totalUnpaidUsers: result2[0].totalUnpaidUsers,
        totalUnpaidAmount: result2[0].totalUnpaidAmount,
      },
    });
  }
  return NextResponse.json({
    paidStats: result[0],
    unpaidStats: result2[0],
  });
}
