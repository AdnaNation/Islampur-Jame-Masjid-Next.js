import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id, year } = await params;
  const yearNum = parseInt(year);
  const { paymentCollection, advanceUseCollection } = await getCollections();
  const [result, advanceResult] = await Promise.all([
    paymentCollection.aggregate([
      { $match: { userId: id, year: yearNum, reverted: { $ne: true } } },
      {
        $addFields: { feeNumber: { $toDouble: "$fee" } },
      },
      {
        $group: {
          _id: "$userId",
          totalFee: { $sum: "$feeNumber" },
        },
      },
    ]).toArray(),
    advanceUseCollection.aggregate([
      { $match: { userId: id, year: yearNum } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $add: [
                { $ifNull: ["$dueUsed", 0] },
                { $ifNull: ["$monthsUsed", 0] },
              ],
            },
          },
        },
      },
    ]).toArray(),
  ]);
  return NextResponse.json({
    totalPaid: (result[0]?.totalFee || 0) + (advanceResult[0]?.total || 0),
  });
}
