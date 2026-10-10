import { getCollections } from "@/lib/mongodb";

const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const TEMPLATE_NAME = "islampur_masjid"; // <- check exact API name from list

async function checkWhatsAppEligible(waId) {
  const res = await fetch(
    `https://graph.facebook.com/v26.0/${WHATSAPP_PHONE_ID}/contacts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blocking: "wait",
        contacts: [waId],
        force_check: true,
      }),
    },
  );
  const data = await res.json();
  return data?.contacts?.[0]?.status === "valid";
}

export async function POST(req) {
  const { to, due_month, due_amount, member_phone } = await req.json();

  // to = customer number, member_phone = for pay link e.g. 01839669990
  let finalTo = String(to).replace(/[^\d]/g, "");
  if (finalTo.startsWith("00")) finalTo = finalTo.slice(2);
  if (finalTo.startsWith("0")) finalTo = "88" + finalTo;

  if (!/^8801[0-9]{9}$/.test(finalTo)) {
    return Response.json(
      { to: finalTo, status: "invalid_number" },
      { status: 200 },
    );
  }

  // Check eligible before spending money
  // const eligible = await checkWhatsAppEligible(finalTo);
  // if (!eligible) {
  //   return Response.json(
  //     { to: finalTo, status: "no_whatsapp" },
  //     { status: 200 },
  //   );
  // }

  const payId = String(member_phone || to)
    .replace(/[^\d]/g, "")
    .slice(-11); // 01839669990 for URL

  const res = await fetch(
    `https://graph.facebook.com/v26.0/${WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: finalTo,
        type: "template",
        template: {
          name: TEMPLATE_NAME,
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: String(due_month) }, // {{1}} October-2026
                { type: "text", text: String(due_amount) }, // {{2}} 700
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [
                { type: "text", text: payId }, // Button {{1}} -> 01839669990
              ],
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
