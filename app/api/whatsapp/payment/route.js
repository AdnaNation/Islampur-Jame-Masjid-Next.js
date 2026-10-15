import { getCollections } from "@/lib/mongodb";

export async function POST(req) {
  const { to, total_amount, slipId } = await req.json();

  let finalTo = String(to).trim();
  if (!finalTo.includes(".")) {
    let clean = finalTo.replace(/[^\d]/g, "");
    if (clean.startsWith("00")) clean = clean.slice(2);
    if (clean.startsWith("0")) clean = "88" + clean;
    finalTo = clean;
  }

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
          name: "payment_confirmation",
          language: { code: "bn" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: String(total_amount) }],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: slipId }],
            },
          ],
        },
      }),
    },
  );

  const data = await res.json();
  return Response.json(
    { to: finalTo, status: data.error ? "failed" : "sent", data },
    { status: 200 },
  );
}
