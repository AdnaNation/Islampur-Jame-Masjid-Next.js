import useAxiosPublic from "@/hooks/useAxiosPublic";

export async function POST(req) {
  const { users } = await req.json(); // [{phone, name, due_month, due_amount}]
  const TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_ID = process.env.PHONE_NUMBER_ID;
  const results = [];
  for (const u of users) {
    try {
      await useAxiosPublic.post(
        `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: u.phone, // 88017xxxx
          type: "template",
          template: {
            name: "due_10_taka", // your approved name
            language: { code: "bn" },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: u.due_month,
                    parameter_name: "due_month",
                  },
                  {
                    type: "text",
                    text: String(u.due_amount),
                    parameter_name: "due_amount",
                  },
                ],
              },
            ],
          },
        },
        { headers: { Authorization: `Bearer ${TOKEN}` } },
      );
      results.push({ phone: u.phone, status: "sent" });
    } catch (e) {
      results.push({
        phone: u.phone,
        status: "failed",
        error: e.response?.data?.error?.message,
      });
    }
    await new Promise((r) => setTimeout(r, 1500)); // 1.5 sec delay
  }
  return Response.json({ results });
}
