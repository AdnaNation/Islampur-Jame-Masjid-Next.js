import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { createPaySlip } from "@/lib/paySlip";
import { parseMonthRange } from "@/lib/monthRange";
import { withIdempotency } from "@/lib/idempotency";
import { requireAdmin } from "@/lib/auth";
import { bad, isId, money, num, str } from "@/lib/validate";
import {
  isReplay,
  safeSms,
  safeWhatsAppReceipt,
  singleReceiptSms,
} from "@/lib/notify";

async function createPayment(request) {
  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object") return bad();

  // only these fields are stored
  const type = ["Monthly", "Tarabi", "Due"].includes(raw.type) ? raw.type : null;
  const fee = money(raw.fee);
  if (!type || !fee) return bad("পেমেন্টের তথ্য সঠিক নয়");
  const paymentData = {
    ...(isId(raw.userId) ? { userId: raw.userId } : {}),
    name: str(raw.name, 100),
    home: str(raw.home, 100),
    fee,
    type,
    ...(str(raw.monthName, 200) ? { monthName: str(raw.monthName, 200) } : {}),
    time: str(raw.time, 60) || new Date().toLocaleString(),
    year: num(raw.year, 2000, 2200) ?? new Date().getFullYear(),
    ...(str(raw.method, 20) ? { method: str(raw.method, 20) } : {}),
    ...(str(raw.trxID, 40) ? { trxID: str(raw.trxID, 40) } : {}),
  };

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

  if (isReplay(request) && ObjectId.isValid(paymentData.userId)) {
    const { userCollection } = await getCollections();
    const user = await userCollection.findOne({
      _id: new ObjectId(paymentData.userId),
    });
    await safeSms(user?.Number, singleReceiptSms(paymentData));
    await safeWhatsAppReceipt({
      to: user?.Number,
      totalAmount: paymentData.fee,
      slipId,
    });
  }

  return NextResponse.json({ ...result, slipId });
}

// sign-in check comes first: nobody anonymous may touch the idempotency store
export const POST = async (request) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return withIdempotency(request, () => createPayment(request));
};
