import { MONTHS, bn } from "@/lib/accountReport";

export function noticeDate(ymd) {
  const [y, m, d] = String(ymd || "").split("-");
  if (!y || !MONTHS[m - 1]) return "";
  return `${bn(Number(d))} ${MONTHS[m - 1]}, ${bn(y)}`;
}

// notice dated within the last `days` days (Dhaka time)
export function isRecent(ymd, days = 7) {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Dhaka",
  });
  const diff =
    (new Date(`${today}T00:00:00Z`) - new Date(`${ymd}T00:00:00Z`)) / 864e5;
  return diff >= 0 && diff <= days;
}
