import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { createPaySlip } from "@/lib/paySlip";
import { parseMonthRange } from "@/lib/monthRange";
import { withIdempotency } from "@/lib/idempotency";

async function createPayment(request) {
  const paymentData = await request.json();
  const { paymentCollection } = await getCollections();
  const result = await paymentCollection.insertOne(paymentData);

  const slipId = await createPaySlip({
    userId: paymentData.userId,
    name: paymentData.name,
    home: paymentData.home,
    method: paymentData.method === "bKash" ? "bkash" : "cash",
    trxID: paymentData.trxID,
    items: [
      {
        type: paymentData.type,
        amount: paymentData.fee,
        months:
          paymentData.type === "Monthly"
            ? parseMonthRange(paymentData.monthName)
            : undefined,
        paymentId: result.insertedId,
      },
    ],
  });

  return NextResponse.json({ ...result, slipId });
}

export const POST = (request) =>
  withIdempotency(request, () => createPayment(request));
