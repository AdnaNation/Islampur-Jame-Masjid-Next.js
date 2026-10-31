const dhaka = (opts) =>
  new Intl.DateTimeFormat("en-u-nu-latn", { timeZone: "Asia/Dhaka", ...opts });

export function hijriParts(now = new Date(), offsetDays = 0) {
  const d = new Date(now.getTime() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(d);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value);
  return { day: get("day"), month: get("month"), year: get("year") };
}

export const isFriday = (now = new Date()) =>
  dhaka({ weekday: "short" }).format(now) === "Fri";

export function getSeason(now = new Date(), offsetDays = 0, override = "") {
  if (override) return override === "none" ? null : override;
  const { day, month } = hijriParts(now, offsetDays);
  if (month === 9) return "ramadan";
  if (month === 10 && day <= 3) return "eid-fitr";
  if (month === 12 && day >= 10 && day <= 13) return "eid-adha";
  if (isFriday(now)) return "jummah";
  return null;
}
