import { sendWhatsAppReceipt } from "@/lib/notify";
import { requireAdmin } from "@/lib/auth";
import { SLIP_ID_PATTERN } from "@/lib/paySlip";
import { isContactNumber, money } from "@/lib/validate";

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const b = await req.json().catch(() => null);
  const amount = money(b?.total_amount);
  if (
    !isContactNumber(b?.to) ||
    !SLIP_ID_PATTERN.test(String(b?.slipId)) ||
    !amount
  )
    return Response.json({ error: "invalid request" }, { status: 400 });

  const result = await sendWhatsAppReceipt({
    to: b.to,
    totalAmount: amount,
    slipId: b.slipId,
  });
  return Response.json(result, { status: 200 });
}
