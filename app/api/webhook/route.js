export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("hub.verify_token") === process.env.VERIFY_TOKEN) {
    return new Response(searchParams.get("hub.challenge"), { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req) {
  const body = await req.json();
  const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (msg) {
    console.log("New message from", msg.from, msg.text?.body);
    // Here you can auto-reply later
  }
  return Response.json({ ok: true });
}
