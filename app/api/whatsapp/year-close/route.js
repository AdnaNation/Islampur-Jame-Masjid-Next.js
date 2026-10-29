import { requireAdmin } from "@/lib/auth";
import { sendWhatsAppYearClose } from "@/lib/notify";
import { isContactNumber, num } from "@/lib/validate";

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const b = await req.json().catch(() => null);
  const year = Number(b?.year);
  const paid = num(b?.paid, 0);
  const due = num(b?.due);
  if (
    !isContactNumber(b?.to) ||
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2200 ||
    paid === null ||
    due === null
  )
    return Response.json({ error: "invalid request" }, { status: 400 });

  const result = await sendWhatsAppYearClose({ to: b.to, year, paid, due });
  return Response.json(result, { status: 200 });
}
