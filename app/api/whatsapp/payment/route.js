import { sendWhatsAppReceipt } from "@/lib/notify";

export async function POST(req) {
  const { to, total_amount, slipId } = await req.json();
  const result = await sendWhatsAppReceipt({
    to,
    totalAmount: total_amount,
    slipId,
  });
  return Response.json(result, { status: 200 });
}
