const FULL = [
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
const SHORT = FULL.map((m) => m.slice(0, 3));

export function formatMonthRange(fullMonthNames = []) {
  // unique month indexes in calendar order (selection order doesn't matter)
  const idx = [...new Set(fullMonthNames.map((m) => FULL.indexOf(m)))]
    .filter((i) => i !== -1)
    .sort((a, b) => a - b);

  const parts = [];
  let start = 0;
  for (let i = 1; i <= idx.length; i++) {
    if (i === idx.length || idx[i] !== idx[i - 1] + 1) {
      const from = idx[start];
      const to = idx[i - 1];
      parts.push(from === to ? SHORT[from] : `${SHORT[from]}-${SHORT[to]}`);
      start = i;
    }
  }
  return parts.join(", ");
}

// "Jan-Mar" | "Jan, Mar-Apr" | "Jan ,Feb" (old)  ->  ["January", ...]
export function parseMonthRange(text = "") {
  const result = [];
  for (const token of String(text).split(",")) {
    const [a, b] = token
      .split("-")
      .map((s) => SHORT.indexOf(s.trim().slice(0, 3)));
    if (a === undefined || a === -1) continue;
    const end = b === undefined || b === -1 ? a : b;
    for (let i = a; i <= end; i++) result.push(FULL[i]);
  }
  return result;
}
