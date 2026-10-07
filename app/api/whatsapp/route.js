export async function POST(req) {
  const { to, due_month, due_amount } = await req.json();

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: "due_utility",
          language: { code: "bn" }, // try en_US, if fails try "bn"
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  parameter_name: "due_month",
                  text: String(due_month),
                },
                {
                  type: "text",
                  parameter_name: "due_amount",
                  text: String(due_amount),
                },
              ],
            },
          ],
        },
      }),
    },
  );

  const data = await res.json();
  console.log(data);
  return Response.json(data);
}
