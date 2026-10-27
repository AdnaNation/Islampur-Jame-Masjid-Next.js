import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
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
