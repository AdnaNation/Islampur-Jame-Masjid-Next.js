import { NextResponse } from "next/server";

export const bad = (message = "অনুরোধটি সঠিক নয়", status = 400) =>
  NextResponse.json({ message }, { status });

export const isId = (v) => typeof v === "string" && /^[a-f0-9]{24}$/i.test(v);

export const escapeRegex = (v) =>
  String(v ?? "")
    .slice(0, 100)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const str = (v, max = 200) =>
  typeof v === "string"
    ? v.trim().slice(0, max)
    : typeof v === "number" && Number.isFinite(v)
      ? String(v).slice(0, max)
      : "";

export const isPhone = (v) => typeof v === "string" && /^\d{11}$/.test(v);

export const money = (v, max = 1e7) => {
  if (v === "" || v === null || v === undefined || typeof v === "object")
    return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= max
    ? Math.round(n * 100) / 100
    : null;
};

export const num = (v, min = -1e7, max = 1e7) => {
  if (v === "" || v === null || v === undefined || typeof v === "object")
    return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max
    ? Math.round(n * 100) / 100
    : null;
};

export const MONTHS = [
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

export const isMonthList = (v) =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.length <= 12 &&
  v.every((m) => MONTHS.includes(m));

// what NON-admins may see of a member / a payment
export const PUBLIC_USER_FIELDS = {
  _id: 1,
  Name: 1,
  NameBn: 1,
  HomeName: 1,
  FeeRate: 1,
  Due: 1,
  Tarabi: 1,
  PayMonths: 1,
};
export const PUBLIC_PAYMENT_FIELDS = {
  _id: 1,
  name: 1,
  home: 1,
  fee: 1,
  type: 1,
  monthName: 1,
  time: 1,
  year: 1,
  method: 1,
  reverted: 1,
};

export const isContactNumber = (v) =>
  typeof v === "string" && /^\d{8,15}$/.test(v.trim());

const maskNumber = (n) =>
  n.length >= 8 ? `${n.slice(0, 3)}*****${n.slice(-3)}` : `*****${n.slice(-2)}`;

export function toPublicUser(doc) {
  if (!doc) return null;
  const { Number: phone, ...rest } = doc;
  const clean = typeof phone === "string" ? phone.trim() : "";
  const has = isContactNumber(clean);
  return {
    ...rest,
    hasNumber: has,
    maskedNumber: has ? maskNumber(clean) : "",
    smsCapable: has && /^\d{11}$/.test(clean),
  };
}
