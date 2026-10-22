import clientPromise from "@/lib/mongodb";
import { addDays } from "@/lib/accountReport";
export async function getAccountCollections() {
  const client = await clientPromise;
  const db = client.db("MosqueDB");
  return {
    transactionCollection: db.collection("transactions"),
    categoryCollection: db.collection("accountCategories"),
    paymentCollection: db.collection("payment"),
    settingsCollection: db.collection("accountSettings"),
  };
}

export const TYPES = ["income", "expense"];

const YMD = /^\d{4}-\d{2}-\d{2}$/;
// A "yyyy-mm-dd" day, interpreted in Dhaka time (UTC+6, no DST).
export const dhakaStart = (ymd) =>
  YMD.test(ymd || "") ? new Date(`${ymd}T00:00:00+06:00`) : null;
export const dhakaEnd = (ymd) =>
  YMD.test(ymd || "") ? new Date(`${ymd}T23:59:59.999+06:00`) : null;
export const validDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

export const cleanName = (v) =>
  String(v ?? "")
    .trim()
    .replace(/\s+/g, " ");

export const cleanAmount = (v) => {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) && n > 0 && n <= 1e9 ? n : null;
};

export const MEMBER_CATEGORY = "মাসিক চাঁদা";
const FEE_TYPES = ["Monthly", "Tarabi", "Due"];
const r2 = (n) => Math.round(n * 100) / 100;

const MDY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/;
export function payDayKey(time) {
  if (typeof time === "string") {
    const m = MDY.exec(time.trim());
    if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  const d = new Date(time);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

export async function memberFeeSummary(fromYmd, toYmd) {
  const { paymentCollection } = await getAccountCollections();
  const docs = await paymentCollection
    .find(
      { reverted: { $ne: true }, type: { $in: FEE_TYPES } },
      { projection: { fee: 1, time: 1, type: 1 } },
    )
    .toArray();

  const sums = { Monthly: 0, Tarabi: 0, Due: 0 };
  let count = 0;
  let before = 0;
  for (const d of docs) {
    const key = payDayKey(d.time);
    const amount = Number(d.fee) || 0;
    if (!key || amount <= 0) continue;
    if (fromYmd && key < fromYmd) {
      before += amount;
      continue;
    }
    if (toYmd && key > toYmd) continue;
    sums[d.type] += amount;
    count += 1;
  }
  const monthly = r2(sums.Monthly);
  const tarabi = r2(sums.Tarabi);
  const due = r2(sums.Due);
  return {
    monthly,
    tarabi,
    due,
    total: r2(monthly + tarabi + due),
    count,
    before: r2(before),
  };
}

export function mergeMemberRow(rows, memberTotal) {
  if (!(memberTotal > 0)) return rows;
  const i = rows.findIndex((r) => r.name === MEMBER_CATEGORY);
  if (i >= 0) {
    const next = [...rows];
    next[i] = { ...next[i], total: r2(next[i].total + memberTotal) };
    return next;
  }
  return [{ name: MEMBER_CATEGORY, total: r2(memberTotal) }, ...rows];
}

export async function getAccountSettings() {
  const { settingsCollection } = await getAccountCollections();
  const doc = await settingsCollection.findOne({ _id: "accounts" });
  return {
    startDate: doc?.startDate || "", // "yyyy-mm-dd"
    openingFund: Number(doc?.openingFund) || 0,
  };
}

export async function netBetween(aYmd, bYmd) {
  const { transactionCollection } = await getAccountCollections();
  const range = {};
  if (aYmd) range.$gte = dhakaStart(aYmd);
  if (bYmd) range.$lte = dhakaEnd(bYmd);
  const match = Object.keys(range).length ? { date: range } : {};
  const [rows, member] = await Promise.all([
    transactionCollection
      .aggregate([
        { $match: match },
        { $group: { _id: "$type", total: { $sum: "$amount" } } },
      ])
      .toArray(),
    memberFeeSummary(aYmd, bYmd),
  ]);
  const of = (t) => rows.find((r) => r._id === t)?.total || 0;
  return r2(of("income") + member.total - of("expense"));
}

export async function openingAt(fromYmd) {
  const { startDate, openingFund } = await getAccountSettings();
  if (!startDate) return netBetween(undefined, addDays(fromYmd, -1));
  if (fromYmd === startDate) return r2(openingFund);
  if (fromYmd > startDate)
    return r2(
      openingFund + (await netBetween(startDate, addDays(fromYmd, -1))),
    );
  return r2(openingFund - (await netBetween(fromYmd, addDays(startDate, -1))));
}
