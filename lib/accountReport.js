export const MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export const YMD = /^\d{4}-\d{2}-\d{2}$/;
export const bn = (v) => String(v).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);

export const parseYmd = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
};
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-12
export const isMonthStart = (s) => parseYmd(s).d === 1;
export const isMonthEnd = (s) => {
  const { y, m, d } = parseYmd(s);
  return d === daysInMonth(y, m);
};
export const addDays = (s, n) => {
  const { y, m, d } = parseYmd(s);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export const fullDate = (s) => {
  const { y, m, d } = parseYmd(s);
  return `${bn(String(d).padStart(2, "0"))} ${MONTHS[m - 1]}, ${bn(y)}`;
};
export const monthYear = (s) => {
  const { y, m } = parseYmd(s);
  return `${MONTHS[m - 1]}, ${bn(y)}`;
};

const monthAligned = (from, to) => isMonthStart(from) && isMonthEnd(to);
export const rangeLabel = (from, to) =>
  monthAligned(from, to)
    ? `${monthYear(from)}- ${monthYear(to)}`
    : `${fullDate(from)} - ${fullDate(to)}`;

export const titleRange = (from, to) => {
  if (!monthAligned(from, to)) return rangeLabel(from, to);
  const a = parseYmd(from);
  const b = parseYmd(to);
  if (a.y === b.y && a.m === b.m) return monthYear(from);
  if (a.y === b.y) return `${MONTHS[a.m - 1]}-${MONTHS[b.m - 1]}, ${bn(a.y)}`;
  return rangeLabel(from, to);
};

export const openingLabel = (from) =>
  isMonthStart(from)
    ? `${monthYear(addDays(from, -1))} শেষে অবশিষ্ট ফান্ড`
    : `${fullDate(addDays(from, -1))} পর্যন্ত অবশিষ্ট ফান্ড`;

export const closingLabel = (to) =>
  isMonthEnd(to)
    ? `${fullDate(addDays(to, 1))}, মসজিদের ফান্ডে অবশিষ্ট আছে`
    : `${fullDate(to)} পর্যন্ত মসজিদের ফান্ডে অবশিষ্ট আছে`;

// 213832 -> "213,832৳"
export const amt = (n) =>
  `${n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}৳`;

const r2 = (n) => Math.round(n * 100) / 100;
const sum = (rows) => r2(rows.reduce((a, r) => a + r.total, 0));

export function buildReport(data, from, manualOpening = "") {
  const typed = String(manualOpening).trim();
  const manual = typed === "" ? null : Number(typed);
  const autoOpening = data.opening || 0;
  const opening =
    manual !== null && Number.isFinite(manual) ? manual : autoOpening;

  const income = [...data.income];
  const expense = [...data.expense];
  if (opening > 0) income.unshift({ name: openingLabel(from), total: opening });
  if (opening < 0)
    expense.unshift({
      name: `পূর্বের ঘাটতি (${openingLabel(from).replace(" অবশিষ্ট ফান্ড", "")})`,
      total: -opening,
    });

  const totalIncome = sum(income);
  const totalExpense = sum(expense);
  return {
    income,
    expense,
    totalIncome,
    totalExpense,
    remaining: r2(totalIncome - totalExpense),
    autoOpening,
  };
}
