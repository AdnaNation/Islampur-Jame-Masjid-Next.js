export const MIN_PASSWORD = 10;
export const ROLES = ["admin", "moderator"];

export const isLoginNumber = (v) =>
  typeof v === "string" && /^\d{6,15}$/.test(v);

export const cleanName = (v) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 60) : "";

export const roleFlags = (role) =>
  role === "moderator"
    ? { admin: false, moderator: true }
    : { admin: true, moderator: false };

export function passwordProblem(pw, number = "") {
  if (typeof pw !== "string" || !pw) return "পাসওয়ার্ড দিন";
  if (pw.length < MIN_PASSWORD)
    return `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD} অক্ষরের হতে হবে`;
  if (pw.length > 200) return "পাসওয়ার্ড অনেক বড়";
  if (/^\d+$/.test(pw)) return "শুধু সংখ্যা দিয়ে পাসওয়ার্ড দেওয়া যাবে না";
  if (number && pw.includes(number))
    return "পাসওয়ার্ডে মোবাইল নাম্বার রাখা যাবে না";
  return "";
}

export const publicAdmin = (d, me) => ({
  number: d.number,
  name: d.name || "",
  role:
    d.admin === true ? "admin" : d.moderator === true ? "moderator" : "none",
  needsReset: !d.passwordHash,
  isMe: d.number === me,
  createdAt: d.createdAt || null,
});
