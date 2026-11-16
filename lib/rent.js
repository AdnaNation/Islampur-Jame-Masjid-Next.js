export const BN_MONTHS = {
  January: "জানুয়ারি",
  February: "ফেব্রুয়ারি",
  March: "মার্চ",
  April: "এপ্রিল",
  May: "মে",
  June: "জুন",
  July: "জুলাই",
  August: "আগস্ট",
  September: "সেপ্টেম্বর",
  October: "অক্টোবর",
  November: "নভেম্বর",
  December: "ডিসেম্বর",
};

// ["February","March","April","June"] -> "ফেব্রুয়ারি–এপ্রিল, জুন"
const ORDER = Object.keys(BN_MONTHS);
export function monthsBn(months = []) {
  const idx = [...new Set(months.map((m) => ORDER.indexOf(m)))]
    .filter((i) => i !== -1)
    .sort((a, b) => a - b);
  const name = (i) => BN_MONTHS[ORDER[i]];
  const parts = [];
  let start = 0;
  for (let i = 1; i <= idx.length; i++) {
    if (i === idx.length || idx[i] !== idx[i - 1] + 1) {
      const from = idx[start];
      const to = idx[i - 1];
      if (from === to) parts.push(name(from));
      else if (to === from + 1) parts.push(`${name(from)}, ${name(to)}`);
      else parts.push(`${name(from)}–${name(to)}`);
      start = i;
    }
  }
  return parts.join(", ");
}

export const fmt = (n) => (Number(n) || 0).toLocaleString("en-IN");

// "12 Nov, 3:45 PM" in Dhaka time
export const dateTimeBn = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

// The year as it is in Dhaka right now
export const dhakaYear = (date = new Date()) =>
  Number(
    date.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }).slice(0, 4),
  );

// What a shopkeeper owes today:
// unpaid months from January up to this month x rent, plus the old due.
export function rentDue(shop, monthIdx = new Date().getMonth()) {
  const rate = Number(shop?.Rent) || 0;
  const pm = shop?.PayMonths || [];
  const unpaidNow = pm
    .slice(0, monthIdx + 1)
    .filter((m) => m.status === "unpaid").length;
  const prevDue = Number(shop?.Due) || 0;
  const monthsAmt = unpaidNow * rate;
  return { rate, unpaidNow, monthsAmt, prevDue, total: monthsAmt + prevDue };
}
