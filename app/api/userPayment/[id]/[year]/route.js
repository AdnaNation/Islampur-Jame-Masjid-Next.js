import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET(request, { params }) {
  const { id, year } = await params;
  const yearNum = parseInt(year);
  const { paymentCollection } = await getCollections();
  const result = await paymentCollection
    .aggregate([
      { $match: { userId: id, year: yearNum } },
      {
        $addFields: { feeNumber: { $toDouble: "$fee" } },
      },
      {
        $group: {
          _id: "$userId",
          totalFee: { $sum: "$feeNumber" },
        },
      },
    ])
    .toArray();
  return NextResponse.json({ totalPaid: result[0]?.totalFee || 0 });
}
