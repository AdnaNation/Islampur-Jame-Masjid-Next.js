import { sendSms } from "@/lib/sms";

export function whatsappNumber(to) {
  let finalTo = String(to).trim();
  if (!finalTo.includes(".")) {
    let clean = finalTo.replace(/[^\d]/g, "");
    if (clean.startsWith("00")) clean = clean.slice(2);
    if (clean.startsWith("0")) clean = "88" + clean;
    finalTo = clean;
  }
  return finalTo;
}

// "payment_confirmation" WhatsApp template (amount + link to the slip)
export async function sendWhatsAppReceipt({ to, totalAmount, slipId }) {
  const finalTo = whatsappNumber(to);
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
              parameters: [{ type: "text", text: String(totalAmount) }],
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
  return { to: finalTo, status: data.error ? "failed" : "sent", data };
}

// year-end summary: "year, paid, due". The template must exist and be approved in Meta first.
export async function sendWhatsAppYearClose({ to, year, paid, due }) {
  const finalTo = whatsappNumber(to);
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
          name: "year_closing",
          language: { code: "bn" },
          components: [
            {
              type: "header",
              parameters: [{ type: "text", text: String(year) }],
            },
            {
              type: "body",
              parameters: [
                { type: "text", text: String(paid) },
                { type: "text", text: String(due) },
              ],
            },
          ],
        },
      }),
    },
  );
  const data = await res.json();
  return { to: finalTo, status: data.error ? "failed" : "sent", data };
}

// never let a failed message break the payment itself
export async function safeSms(number, message) {
  if (!number || String(number).length !== 11 || !message) return;
  try {
    await sendSms(number, message);
  } catch {}
}
export async function safeWhatsAppReceipt(args) {
  if (!args.to || !args.slipId) return;
  try {
    await sendWhatsAppReceipt(args);
  } catch {}
}

// the same SMS wording the fee window uses for a single payment
export function singleReceiptSms(p) {
  if (p.type === "Monthly")
    return `ইসলামপুর জামে মসজিদের ${p.monthName}'র মাসিক চাঁদা বাবদ ৳${p.fee} পরিশোধ করেছেন।`;
  if (p.type === "Tarabi")
    return `আপনি তারাবীর চাঁদা বাবদ ৳${p.fee} পরিশোধ করেছেন। -ইসলামপুর জামে মসজিদ`;
  if (p.type === "Due")
    return `আপনি আগের বছরের বকেয়া চাঁদা বাবদ ৳${p.fee} পরিশোধ করেছেন। -ইসলামপুর জামে মসজিদ`;
  return null;
}

// true when the request is a saved-offline payment being sent now
export const isReplay = (request) => !!request.headers.get("x-queued-at");
