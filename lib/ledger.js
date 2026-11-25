import { getCollections } from "@/lib/mongodb";
import { parseMonthRange } from "@/lib/monthRange";

const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export async function getLedger({ year, home } = {}) {
  const { userCollection, paymentCollection, advanceUseCollection } =
    await getCollections();
  const currentYear = new Date().getFullYear();
  year = Number(year) || currentYear;

  const users = await userCollection
    .find(home ? { HomeName: home } : {}, {
      projection: {
        Name: 1,
        NameBn: 1,
        Number: 1,
        HomeName: 1,
        Due: 1,
        FeeRate: 1,
        "prevYear.Due": 1,
        "prevYear.FeeRate": 1,
      },
    })
    .toArray();

  const payments = await paymentCollection
    .find(
      {
        year,
        reverted: { $ne: true },
        userId: { $in: users.map((u) => String(u._id)) },
      },
      { projection: { userId: 1, fee: 1, type: 1, monthName: 1 } },
    )
    .toArray();

  const rows = new Map();
  for (const u of users) {
    const snapshot =
      year === currentYear ? u : year === currentYear - 1 ? u.prevYear : null;
    rows.set(String(u._id), {
      home: u.HomeName || "-",
      name: u.NameBn || u.Name || "-",
      mobile: u.Number || "",
      previousDue: year === currentYear ? Number(u.prevYear?.Due) || 0 : 0,
      dueRepaid: 0,
      rate: Number(snapshot?.FeeRate) || 0,
      months: Array(12).fill(0),
      tarabi: 0,
      remainingDue: year === currentYear ? Number(u.Due) || 0 : 0,
    });
  }

  for (const p of payments) {
    const row = rows.get(String(p.userId));
    if (!row) continue;
    const amount = Math.round(Number(p.fee) || 0);

    if (p.type === "Monthly") {
      const idx = parseMonthRange(p.monthName).map((m) =>
        FULL_MONTHS.indexOf(m),
      );
      if (idx.length === 0) continue;

      const base = Math.floor(amount / idx.length);
      const extra = amount - base * idx.length;
      idx.forEach((monthIndex, n) => {
        row.months[monthIndex] += base + (n < extra ? 1 : 0);
      });
    } else if (p.type === "Tarabi") {
      row.tarabi += amount;
    } else if (p.type === "Due") {
      row.dueRepaid += amount;
    }
  }

  // Include monthly fees and dues settled from advances received in an earlier year.
  const advanceUses = await advanceUseCollection
    .find(
      { year, userId: { $in: users.map((u) => String(u._id)) } },
      { projection: { userId: 1, months: 1, monthsUsed: 1, dueUsed: 1, tarabiUsed: 1 } },
    )
    .toArray();

  for (const advance of advanceUses) {
    const row = rows.get(String(advance.userId));
    if (!row) continue;
    const indexes = (advance.months || [])
      .map((month) => FULL_MONTHS.indexOf(month))
      .filter((index) => index >= 0);
    if (indexes.length) {
      const total = Math.round(Number(advance.monthsUsed) || 0);
      const base = Math.floor(total / indexes.length);
      const extra = total - base * indexes.length;
      indexes.forEach((monthIndex, index) => {
        row.months[monthIndex] += base + (index < extra ? 1 : 0);
      });
    }
    row.dueRepaid += Math.round(Number(advance.dueUsed) || 0);
    row.tarabi += Math.round(Number(advance.tarabiUsed) || 0);
  }

  const byHome = new Map();
  for (const row of rows.values()) {
    if (!byHome.has(row.home)) byHome.set(row.home, []);
    byHome.get(row.home).push(row);
  }

  return [...byHome.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "bn"))
    .map(([homeName, members]) => ({ home: homeName, members }));
}
