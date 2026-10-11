import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

const YEARS_BACK = 1;

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { paymentCollection } = await getCollections();
    const fromYear = new Date().getFullYear() - YEARS_BACK;

    const payments = await paymentCollection
      .find(
        {
          userId: id,
          year: { $gte: fromYear },
          reverted: { $ne: true },
        },
        {
          projection: {
            fee: 1,
            type: 1,
            monthName: 1,
            time: 1,
            year: 1,
            method: 1,
          },
        },
      )
      .sort({ _id: -1 })
      .toArray();

    return NextResponse.json(payments);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
