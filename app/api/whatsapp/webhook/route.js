// Verify Token - you create this, use same in Meta dashboard
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// 1. For Meta Verification (GET)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK VERIFIED");
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// 2. When someone sends message (POST)
export async function POST(req) {
  try {
    const body = await req.json();

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message)
      return Response.json({ status: "no message" }, { status: 200 });

    const from = message.from; // user's number 8801...
    const text = message.text?.body?.toLowerCase() || "";

    console.log(`Message from ${from}: ${text}`);

    let replyText = "";

    // --- Your Auto-Reply Logic ---
    if (
      text.includes("due") ||
      text.includes("বকেয়া") ||
      text.includes("বাকি")
    ) {
      replyText = `আসসালামু আলাইকুম।\n\nআপনার বকেয়া জানতে অনুগ্রহ করে আপনার নাম বা সদস্য আইডি লিখুন।\n\nউদাহরণ: Due 101`;
    } else if (
      text.includes("assalam") ||
      text.includes("সালাম") ||
      text.includes("hello") ||
      text.includes("hi")
    ) {
      replyText = `ওয়া আলাইকুমুস সালাম।\n\nইসলামপুর জামে মসজিদে আপনাকে স্বাগতম।\n\n1. বকেয়া জানতে - Due লিখুন\n2. কমিটির সাথে যোগাযোগ - Contact লিখুন\n3. নামাজের সময় - Namaz লিখুন`;
    } else if (text.includes("contact") || text.includes("যোগাযোগ")) {
      replyText = `কমিটির সাথে যোগাযোগ:\n📞 01776-236285\n\nঅফিস সময়: সকাল ৯টা - বিকাল ৫টা`;
    } else {
      replyText = `আপনার মেসেজ পেয়েছি। শীঘ্রই একজন প্রতিনিধি আপনাকে রিপ্লাই দিবে ইনশাআল্লাহ।\n\nবকেয়া চেক করতে Due লিখুন।`;
    }

    // Send reply back
    await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          type: "text",
          text: { body: replyText },
        }),
      },
    );

    return Response.json({ status: "sent" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return Response.json({ error: err.message }, { status: 200 });
  }
}
