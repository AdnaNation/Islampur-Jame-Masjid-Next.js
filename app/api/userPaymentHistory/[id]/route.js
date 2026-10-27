import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { bad, isId } from "@/lib/validate";

const YEARS_BACK = 1;

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!isId(id)) return bad("ভুল আইডি");

    const session = await getSession(request);
    if (session?.admin !== true) {
      if (process.env.PUBLIC_MEMBER_BOARD === "false")
        return NextResponse.json(
          { message: "এডমিন হিসেবে আবার সাইন ইন করুন" },
          { status: 401 },
        );
      const limited = await rateLimit(request, {
        name: "user-payment-history",
        limit: 60,
        windowSec: 60,
      });
      if (limited) return limited;
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
