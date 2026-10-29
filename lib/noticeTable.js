export const MAX_TABLES = 5;
export const MAX_COLS = 8;
export const MAX_ROWS = 200;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const hasBn = (s) => /[০-৯]/.test(String(s ?? ""));
const toAscii = (s) => String(s).replace(/[০-৯]/g, (d) => BN_DIGITS.indexOf(d));

// "১,২০০ টাকা", "৳ 1200/-", "-50.5"  ->  number, or null when it is not a number
export function parseAmount(cell) {
  const raw = String(cell ?? "").trim();
  if (!raw) return null;
  const s = toAscii(raw)
    .replace(/টাকা|taka|tk\.?|\/-|৳/gi, "")
    .replace(/[,\s]/g, "");
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}

// The admin writes  [[table:1]]  on its own line to place table number 1 there.
// Tables that are not placed anywhere are added after the text.
const MARKER = /\[\[table:(\d+)\]\]/g;
export const markerFor = (n) => `[[table:${n}]]`;

export function splitBody(body, tableCount = 0) {
  const text = String(body ?? "").replace(/\r\n/g, "\n");
  const parts = [];
  const used = new Set();
  let last = 0;
  let m;
  MARKER.lastIndex = 0;

  const pushText = (s) => {
    if (s.trim() !== "") parts.push({ type: "text", text: s });
  };

  let pending = "";
  while ((m = MARKER.exec(text))) {
    pending += text.slice(last, m.index);
    last = m.index + m[0].length;
    const k = Number(m[1]);
    if (k >= 1 && k <= tableCount && !used.has(k)) {
      used.add(k);
      pending = pending.replace(/\n$/, "");
      pushText(pending);
      pending = "";
      if (text[last] === "\n") last += 1;
      parts.push({ type: "table", index: k - 1 });
    }
    // an unknown / repeated marker is simply dropped
  }
  pending += text.slice(last);
  pushText(pending);

  for (let k = 1; k <= tableCount; k++)
    if (!used.has(k)) parts.push({ type: "table", index: k - 1 });
  return parts;
}

// take a table's marker out of some text (used before the marker is placed again)
export const withoutMarker = (text, k) =>
  String(text ?? "").replace(new RegExp(`\\n?\\[\\[table:${k}\\]\\]`, "g"), "");

// Deleting table k: remove its marker and move the later markers down by one.
export function removeTableFromBody(body, k) {
  return String(body ?? "")
    .replace(new RegExp(`\\n?\\[\\[table:${k}\\]\\]\\n?`, "g"), "\n")
    .replace(MARKER, (all, d) => {
      const n = Number(d);
      return n > k ? markerFor(n - 1) : all;
    });
}

// numeric column -> narrower, right aligned (the first column is only a label / serial)
export function columnInfo(t) {
  return t.columns.map((_, i) => {
    const cells = t.rows
      .map((r) => r[i])
      .filter((c) => String(c).trim() !== "");
    const numeric =
      cells.length > 0 && cells.every((c) => parseAmount(c) !== null);
    return {
      numeric,
      bengali: cells.some(hasBn),
      align: numeric ? (i === 0 ? "center" : "right") : "left",
      weight: numeric ? 1 : 2,
    };
  });
}

const fmt = (n, bengali) =>
  n.toLocaleString(bengali ? "bn-BD" : "en-IN", { maximumFractionDigits: 2 });

// the "মোট" row: label in column 1, sums for every other fully numeric column
export function totalsRow(t, info = columnInfo(t)) {
  return t.columns.map((_, i) => {
    if (i === 0) return "মোট";
    if (!info[i].numeric) return "";
    const sum = t.rows.reduce((s, r) => s + (parseAmount(r[i]) ?? 0), 0);
    return fmt(sum, info[i].bengali);
  });
}

// Copying cells from a spreadsheet gives tab-separated text. First line = headings.
export function parsePasted(text) {
  const lines = String(text ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""));
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  if (!lines.length) return null;

  const grid = lines.map((l) => l.split("\t").map((c) => c.trim()));
  const width = Math.min(MAX_COLS, Math.max(...grid.map((r) => r.length)));
  const fit = (r) => Array.from({ length: width }, (_, i) => r[i] ?? "");
  const [head, ...rest] = grid.map(fit);
  return {
    columns: head,
    rows: rest.slice(0, MAX_ROWS).filter((r) => r.some((c) => c !== "")),
  };
}

export const newTable = (kind = "basic") =>
  kind === "income"
    ? {
        title: "আয়-ব্যয়ের হিসাব",
        columns: ["ক্রম", "বিবরণ", "আয় (৳)", "ব্যয় (৳)"],
        rows: [
          ["১", "", "", ""],
          ["২", "", "", ""],
          ["৩", "", "", ""],
        ],
        showTotal: true,
      }
    : {
        title: "",
        columns: ["বিবরণ", "টাকা"],
        rows: [
          ["", ""],
          ["", ""],
          ["", ""],
        ],
        showTotal: false,
      };
