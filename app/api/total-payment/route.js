import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const { paymentCollection } = await getCollections();
  const pipeline = [
    { $match: { year } },
    {
      $addFields: {
        feeAsNumber: {
          $cond: {
            if: { $isNumber: "$fee" },
            then: "$fee",
            else: { $toDouble: "$fee" },
          },
        },
      },
    },
    {
      $group: {
        _id: "$type",
        totalAmount: { $sum: "$feeAsNumber" },
      },
    },
  ];

  const result = await paymentCollection.aggregate(pipeline).toArray();

  const mapped = {};
  result.forEach((item) => {
    mapped[item._id] = item;
  });
  return NextResponse.json({
    Tarabi: mapped.Tarabi || { _id: "Tarabi", totalAmount: 0 },
    Monthly: mapped.Monthly || { _id: "Monthly", totalAmount: 0 },
    Due: mapped.Due || { _id: "Due", totalAmount: 0 },
  });
}
