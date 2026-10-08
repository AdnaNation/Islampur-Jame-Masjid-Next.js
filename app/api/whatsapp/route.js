import { getCollections } from "@/lib/mongodb";

export async function POST(req) {
  const { to, due_month, due_amount } = await req.json();
  if (!to) return Response.json({ error: "to required" }, { status: 400 });

  let finalTo = String(to).trim();
  if (!finalTo.includes(".")) {
    let clean = finalTo.replace(/[^\d]/g, "");
    if (clean.startsWith("00")) clean = clean.slice(2);
    if (clean.startsWith("0")) clean = "88" + clean;
    finalTo = clean;
  }

  const textToSave = `Due: ${due_month}, Amount: ৳${due_amount} - Islampur Jame Masjid`;

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
          name: "mosque_msg",
          language: { code: "bn" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: String(due_month) },
                { type: "text", text: String(due_amount) },
              ],
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
                template: "mosque_msg",
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
