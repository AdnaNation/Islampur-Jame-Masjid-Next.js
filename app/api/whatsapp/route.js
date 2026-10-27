import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { isPhone, str } from "@/lib/validate";

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const b = await req.json().catch(() => null);
  const to = b?.to;
  const due_month = str(b?.due_month, 40);
  const due_amount = str(b?.due_amount, 20);
  if (!isPhone(to) || !due_month || !due_amount)
    return Response.json({ error: "to required" }, { status: 400 });

  let finalTo = String(to).trim();
  if (!finalTo.includes(".")) {
    let clean = finalTo.replace(/[^\d]/g, "");
    if (clean.startsWith("00")) clean = clean.slice(2);
    if (clean.startsWith("0")) clean = "88" + clean;
    finalTo = clean;
  }

  const textToSave = `Due: ${due_month}, Amount: ৳${due_amount}, link: https://islampurmasjid.com/pay/${to}`;

  const res = await fetch(
    `https://graph.facebook.com/v26.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: finalTo,
        type: "template",
        template: {
          name: "islampur_masjid",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: String(due_month) },
                { type: "text", text: String(due_amount) },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: to }],
            },
          ],
        },
      }),
    },
  );

  const data = await res.json();

  try {
    const { sessionCollection } = await getCollections();
    await sessionCollection.updateOne(
      { _id: finalTo },
      {
        $push: {
          outgoingLogs: {
            $each: [
              {
                to: finalTo,
                message: textToSave,
                template: "islampur_masjid",
                status: data.error ? "failed" : "sent",
                fbResponse: data,
                sentAt: new Date().toLocaleString("en-US", {
                  timeZone: "Asia/Dhaka",
                }),
              },
            ],
            $position: 0,
            $slice: 100,
          },
        },
      },
      { upsert: true },
    );
  } catch (e) {
    console.error("waSession log save failed", e.message);
  }

  if (data.error)
    return Response.json(
      { to: finalTo, status: "no_whatsapp", error: data.error },
      { status: 200 },
    );
  return Response.json(
    { to: finalTo, status: "sent", data },
    { status: res.status },
  );
}
