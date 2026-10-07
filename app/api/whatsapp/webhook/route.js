import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

/* ---------------- messages (edit the text here) ---------------- */
const GREETING = `ওয়া আলাইকুমুস সালাম।\n\nইসলামপুর জামে মসজিদে আপনাকে স্বাগতম।\n\n1. বকেয়া জানতে - Due লিখুন\n2. কমিটির সাথে যোগাযোগ - Contact লিখুন\n3. নামাজের সময় - Namaz লিখুন`;
const CONTACT = `কমিটির সাথে যোগাযোগ:\n📞 01776-236285\n\nঅফিস সময়: সকাল ৯টা - বিকাল ৫টা`;
const FALLBACK = `আপনার মেসেজ পেয়েছি। শীঘ্রই একজন প্রতিনিধি আপনাকে রিপ্লাই দিবে ইনশাআল্লাহ।\n\nবকেয়া চেক করতে Due লিখুন।`;

/* ---------------- helpers ---------------- */
// Bangla digits -> English digits, so "১" works like "1"
const normalize = (s = "") =>
  s
    .replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d))
    .trim()
    .toLowerCase();

const byBn = (a, b) => (a || "").localeCompare(b || "", "bn");
const clip = (t) => (t.length > 3900 ? t.slice(0, 3850) + "\n…" : t); // WhatsApp limit is 4096

// current month in Bangladesh time (server may run in UTC)
const dhakaMonthIndex = () =>
  Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      month: "numeric",
    }).format(new Date()),
  ) - 1;

async function send(to, body) {
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
        to,
        type: "text",
        text: { body: clip(body) },
      }),
    },
  );
  if (!res.ok)
    console.error("WhatsApp send failed:", res.status, await res.text());
}

// same rule as your fee page: Tarabi counts only while it is active
async function tarabiActive(req) {
  try {
    const res = await fetch(new URL("/api/activeStatus", req.url));
    return !!(await res.json());
  } catch {
    return false;
  }
}

/* ---------------- the three screens ---------------- */
async function homeList(userCollection) {
  const homes = (await userCollection.distinct("HomeName"))
    .filter(Boolean)
    .sort(byBn);
  const text =
    "আপনার বাড়ির নাম্বার লিখুন:\n\n" +
    homes.map((h, i) => `${i + 1}. ${h}`).join("\n") +
    "\n\nপ্রধান মেনুতে যেতে Hi লিখুন।";
  return { text, state: { step: "home", homes, users: [] } };
}

async function memberList(userCollection, home) {
  const users = await userCollection
    .find({ HomeName: home }, { projection: { NameBn: 1, Name: 1 } })
    .toArray();
  users.sort((a, b) => byBn(a.NameBn || a.Name, b.NameBn || b.Name));
  const text =
    `🏠 ${home}\n\nসদস্যের নাম্বার লিখুন:\n\n` +
    users.map((u, i) => `${i + 1}. ${u.NameBn || u.Name}`).join("\n") +
    "\n\n0 - বাড়ির তালিকায় ফিরুন";
  return {
    text,
    state: { step: "user", home, users: users.map((u) => String(u._id)) },
  };
}

function dueMessage(u, tarabiOn) {
  const rate = Number(u.FeeRate) || 0;
  const unpaid = (u.PayMonths || [])
    .slice(0, dhakaMonthIndex() + 1)
    .filter((m) => m.status === "unpaid").length;
  const prev = Number(u.Due) || 0;
  const tarabi =
    tarabiOn && u.Tarabi?.status === "unpaid" ? Number(u.Tarabi?.fee) || 0 : 0;
  const total = unpaid * rate + prev + tarabi;

  const lines = [
    `👤 ${u.NameBn || u.Name}`,
    `🏠 ${u.HomeName}`,
    "",
    `চাঁদার হার: ৳${rate}`,
  ];
  if (total <= 0) {
    lines.push("", "আলহামদুলিল্লাহ, কোনো বকেয়া নেই।");
  } else {
    lines.push(`এই বছরের বকেয়া: ${unpaid} মাস = ৳${unpaid * rate}`);
    if (prev) lines.push(`আগের বছরের বকেয়া: ৳${prev}`);
    if (tarabi) lines.push(`তারাবীর বকেয়া: ৳${tarabi}`);
    lines.push("", `মোট বকেয়া: ৳${total}`);
  }
  lines.push("", "অন্য সদস্যের নাম্বার লিখুন, বাড়ির তালিকায় ফিরতে 0 লিখুন।");
  return lines.join("\n");
}

/* ---------------- 1. Meta verification (GET) ---------------- */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (
    searchParams.get("hub.mode") === "subscribe" &&
    searchParams.get("hub.verify_token") === VERIFY_TOKEN
  ) {
    return new Response(searchParams.get("hub.challenge"), { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/* ---------------- 2. Incoming messages (POST) ---------------- */
export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message)
      return Response.json({ status: "no message" }, { status: 200 });

    const from = message.from;
    const text = normalize(
      message.type === "text" ? (message.text?.body ?? "") : "",
    );
    const n = /^\d+$/.test(text) ? Number(text) : null;

    const { userCollection, sessionCollection } = await getCollections();
    const session = await sessionCollection.findOne({ _id: from });
    if (session?.lastId === message.id) {
      return Response.json({ status: "duplicate" }, { status: 200 }); // Meta retry
    }

    let out; // { text, state }
    if (/due|বকেয়া|বাকি/.test(text) || (n === 0 && session?.step === "home")) {
      out = await homeList(userCollection);
    } else if (n !== null && session?.step === "home") {
      const home = session.homes?.[n - 1];
      out = home
        ? await memberList(userCollection, home)
        : {
            text: `সঠিক নাম্বার লিখুন (1 - ${session.homes.length})`,
            state: {},
          };
    } else if (n !== null && session?.step === "user") {
      if (n === 0) {
        out = await homeList(userCollection);
      } else {
        const id = session.users?.[n - 1];
        const user =
          id && (await userCollection.findOne({ _id: new ObjectId(id) }));
        out = user
          ? { text: dueMessage(user, await tarabiActive(req)), state: {} }
          : {
              text: `সঠিক নাম্বার লিখুন (1 - ${session.users.length})`,
              state: {},
            };
      }
    } else if (/assalam|সালাম|hello|\bhi\b|menu|মেনু|adnan/.test(text)) {
      out = { text: GREETING, state: { step: null } };
    } else if (/contact|যোগাযোগ/.test(text)) {
      out = { text: CONTACT, state: {} };
    } else {
      out = { text: FALLBACK, state: {} };
    }

    await sessionCollection.updateOne(
      { _id: from },
      { $set: { ...out.state, lastId: message.id, updatedAt: new Date() } },
      { upsert: true },
    );
    await send(from, out.text);
    return Response.json({ status: "sent" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 200 });
  }
}
