import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const GREETING = `আসসালামু আলাইকুম।\n\n🕌 *ইসলামপুর জামে মসজিদ* সেবায় আপনাকে স্বাগতম।\n\nসহজে তথ্য পেতে নিচের নম্বর বা কিওয়ার্ডগুলো লিখে মেসেজ দিন:\n\n1️⃣ *Due* (বা ১) - বকেয়া জানতে\n2️⃣ *Contact* (বা ২) - কমিটির সাথে যোগাযোগ\n\n_যেকোনো সময় প্রধান মেনুতে ফিরতে *Menu* বা *0* লিখুন।_`;

const CONTACT = `📞 *মসজিদ কমিটির সাথে যোগাযোগ*\n\n• *সাধারণ সম্পাদক:*\n 01730183325 (আরমান স্যার)\n• *সহ-সাধারণ সম্পাদক:*\n 01776236285 (আদনান)\n*WhatsApp কমিউনিটি:*\n *https://chat.whatsapp.com/Jaxo7XIK62DIoSw0qaSyVV*\n\nজরুরি প্রয়োজনে সরাসরি কল/ম্যাসেজ দেয়ার অনুরোধ করা যাচ্ছে।`;

// const NAMAZ_SCHEDULE = `🕌 *নামাজের সময়সূচি*\n\n• **ফজর:** ৫:১৫ মি.\n• **জোহর:** ১:১৫ মি.\n• **আসর:** ৪:৩০ মি.\n• **মাগরিব:** ৬:০৫ মি.\n• **এশা:** ৭:৩০ মি.\n• **জুমআ:** ১:৩০ মি.\n\n_(সময়সূচি পরিবর্তন সাপেক্ষ)_`;

const FALLBACK = `দুঃখিত, আপনার উত্তরটি বোঝা যায়নি। \n\nমূল মেনুতে ফিরতে *Menu* বা *Hi* লিখুন অথবা বকেয়া জানতে *Due* লিখুন।`;

const bnMap = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};
const normalize = (s = "") =>
  s
    .replace(/[০-৯]/g, (d) => bnMap[d] ?? d)
    .trim()
    .toLowerCase();
const byBn = (a, b) => (a || "").localeCompare(b || "", "bn");
const clip = (t) => (t.length > 3900 ? t.slice(0, 3850) + "\n…" : t);

const dhakaMonthIndex = () =>
  Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      month: "numeric",
    }).format(new Date()),
  ) - 1;

async function send(to, body) {
  if (!to) {
    console.error("SEND ABORT: to empty");
    return;
  }
  const isUserId = String(to).includes(".");
  let finalTo = String(to).trim();

  if (!isUserId) {
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
        type: "text",
        text: { body: clip(body) },
      }),
    },
  );
  const txt = await res.text();
  if (!res.ok) console.error("WhatsApp send failed:", res.status, txt);
}
async function tarabiActive() {
  try {
    const { userCollection } = await getCollections();
    const doc = await userCollection.findOne(
      { "Tarabi.active": { $exists: true } },
      { projection: { "Tarabi.active": 1 } },
    );
    return doc?.Tarabi?.active === true;
  } catch {
    return false;
  }
}

async function homeList(userCollection) {
  const agg = await userCollection
    .aggregate([
      { $match: { HomeName: { $exists: true, $ne: "" } } },
      { $group: { _id: "$HomeName" } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
  const homes = agg
    .map((d) => d._id)
    .filter(Boolean)
    .sort(byBn);
  if (!homes.length)
    return {
      text: "কোনো বাড়ির তালিকা পাওয়া যায়নি।\n\nমেনুতে ফিরতে *0* লিখুন।",
      state: { step: null },
    };
  const text =
    "🏠 *আপনার বাড়ির নাম্বার লিখে উত্তর দিন:*\n\n" +
    homes.map((h, i) => `*${i + 1}.* ${h}`).join("\n") +
    "\n\n_প্রধান মেনুতে যেতে *0* বা *Menu* লিখুন।_";
  return { text, state: { step: "home", homes, users: [] } };
}

async function memberList(userCollection, home) {
  const users = await userCollection
    .find({ HomeName: home }, { projection: { NameBn: 1, Name: 1 } })
    .toArray();
  users.sort((a, b) => byBn(a.NameBn || a.Name, b.NameBn || b.Name));
  if (!users.length)
    return {
      text: `🏠 *${home}* এ কোনো সদস্য পাওয়া যায়নি।\n\nবাড়ির তালিকায় ফিরতে *0* লিখুন।`,
      state: { step: "home" },
    };
  const text =
    `🏠 *${home}*\n\n👤 *সদস্যের নাম্বার নির্বাচন করুন:*\n\n` +
    users.map((u, i) => `*${i + 1}.* ${u.NameBn || u.Name}`).join("\n") +
    "\n\n_0 - বাড়ির তালিকায় ফিরুন_";
  return {
    text,
    state: { step: "user", home, users: users.map((u) => String(u._id)) },
  };
}

function dueMessage(u, tarabiOn, waId) {
  const monthName = new Date().toLocaleString("en-US", { month: "long" });
  const currentYear = new Date().getFullYear();
  const rate = Number(u.FeeRate) || 0;
  const unpaid = (u.PayMonths || [])
    .slice(0, dhakaMonthIndex() + 1)
    .filter((m) => m.status === "unpaid").length;
  const prev = Number(u.Due) || 0;
  const tarabi =
    tarabiOn && u.Tarabi?.status === "unpaid" ? Number(u.Tarabi?.fee) || 0 : 0;
  const total = unpaid * rate + prev + tarabi;
  const lines = [
    `📋 *বকেয়া তথ্য*`,
    `👤 *নাম:* ${u.NameBn || u.Name}`,
    `🏠 *বাড়ি:* ${u.HomeName}`,
    `💳 *মাসিক চাঁদার হার:* ৳${rate}`,
    "----------------------------------",
  ];
  if (total <= 0) lines.push("✅ *আলহামদুলিল্লাহ, আপনার কোনো বকেয়া নেই।*");

  if (unpaid > 0)
    lines.push(
      `• ${monthName}-${currentYear} পর্যন্ত বকেয়া: ৳${unpaid * rate}`,
    );
  if (prev > 0) lines.push(`• পূর্বের বছরের বকেয়া: ৳${prev}`);
  if (tarabi > 0) lines.push(`• তারাবীর চাঁদা: ৳${tarabi}`);
  lines.push(
    "----------------------------------",
    `💰 *সর্বমোট বকেয়া:* *৳${total}*`,
  );

  // ✅ শুধু নিজের নাম্বার হলে দেখাবে
  if (u.Number && waId) {
    const cleanWa = String(waId).replace(/\D/g, "");
    const cleanNum = String(u.Number).replace(/\D/g, "");
    // শেষ 10 ডিজিট মিললেই নিজের নাম্বার
    if (cleanWa.endsWith(cleanNum.slice(-10))) {
      lines.push(
        `পরিশোধ করতে ভিজিট করুন: *islampurjamemasjid.org/pay/${u.Number}*`,
      );
    } else {
      lines.push(`পরিশোধ করতে ভিজিট করুন: *islampurjamemasjid.org/pay*`);
    }
    lines.push(
      "\n*WhatsApp কমিউনিটি:*\n *https://chat.whatsapp.com/Jaxo7XIK62DIoSw0qaSyVV*\n",
    );
  }

  lines.push(
    "\n_অন্য সদস্যের তথ্য দেখতে নাম্বার লিখুন, অথবা বাড়ির তালিকায় ফিরতে *0* লিখুন।_",
  );
  return lines.join("\n");
}

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

export async function POST(req) {
  try {
    const body = await req.json();
    const value = body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message)
      return Response.json({ status: "no message" }, { status: 200 });

    const from =
      message.from ||
      message.from_user_id ||
      value?.contacts?.[0]?.wa_id ||
      value?.contacts?.[0]?.user_id;
    if (!from) {
      console.error("NO SENDER:", JSON.stringify(value));
      return Response.json({ status: "no_sender" }, { status: 200 });
    }

    const text = normalize(
      message.type === "text" ? (message.text?.body ?? "") : "",
    );
    const n = /^\d+$/.test(text) ? Number(text) : null;

    const { userCollection, sessionCollection } = await getCollections();
    const session = await sessionCollection.findOne({ _id: from });

    if (session?.lastId === message.id)
      return Response.json({ status: "duplicate" }, { status: 200 });

    const isSessionExpired =
      session?.updatedAt &&
      Date.now() - new Date(session.updatedAt).getTime() > 15 * 60 * 1000;
    const currentStep = isSessionExpired ? null : session?.step;

    let out;

    if (
      /^(hi|hello|hlw|hey|start|menu|মেনু|সালাম|salam)$/.test(text) ||
      (n === 0 && !currentStep)
    ) {
      out = { text: GREETING, state: { step: null } };
    } else if (n !== null && currentStep === "home") {
      if (n === 0) out = { text: GREETING, state: { step: null } };
      else {
        const home = session.homes?.[n - 1];
        out = home
          ? await memberList(userCollection, home)
          : {
              text: `⚠️ নম্বরটি সঠিক নয়। 1 থেকে ${session.homes?.length || 0} এর মধ্যে দিন।`,
              state: { step: "home", homes: session.homes },
            };
      }
    } else if (n !== null && currentStep === "user") {
      if (n === 0) out = await homeList(userCollection);
      else {
        const id = session.users?.[n - 1];
        let user = null;
        if (id)
          try {
            user = await userCollection.findOne({ _id: new ObjectId(id) });
          } catch {}
        out = user
          ? {
              text: dueMessage(user, await tarabiActive(), from),
              state: {
                step: "user",
                home: session.home,
                users: session.users,
                homes: session.homes,
              },
            }
          : {
              text: `⚠️ নম্বরটি সঠিক নয়। 1 থেকে ${session.users?.length || 0} এর মধ্যে দিন।`,
              state: { step: "user", home: session.home, users: session.users },
            };
      }
    } else if (text === "1" || /^(due|বকেয়া|বাকি)$/.test(text)) {
      out = await homeList(userCollection);
      // } else if (text === "2" || /^(namaz|নামাজ|সময়)$/.test(text)) {
      //   out = { text: NAMAZ_SCHEDULE, state: { step: null } };
    } else if (text === "2" || /^(contact|যোগাযোগ|কমিটি)$/.test(text)) {
      out = { text: CONTACT, state: { step: null } };
    } else {
      out = { text: FALLBACK, state: { step: null } };
    }

    await sessionCollection.updateOne(
      { _id: from },
      {
        $set: {
          ...out.state,
          lastId: message.id,
          updatedAt: new Date().toLocaleString("en-US", {
            timeZone: "Asia/Dhaka",
          }),
        },
      },
      { upsert: true },
    );
    await send(from, out.text);
    return Response.json({ status: "sent" }, { status: 200 });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return Response.json({ error: err.message }, { status: 200 });
  }
}
