import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { getSession, sessionCookie, signSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { hashPassword, legacyEquals, verifyPassword } from "@/lib/password.mjs";
import { bad } from "@/lib/validate";
import { passwordProblem } from "@/lib/adminAccounts";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const s = await getSession(request);
  if (!s) return bad("এডমিন হিসেবে আবার সাইন ইন করুন", 401);

  const limited = await rateLimit(request, {
    name: "change-password",
    key: `${s.number}|${clientIp(request)}`,
    limit: 5,
    windowSec: 900,
  });
  if (limited) return limited;

  const b = await request.json().catch(() => null);
  const current =
    typeof b?.currentPassword === "string" ? b.currentPassword : "";
  const next = typeof b?.newPassword === "string" ? b.newPassword : "";
  if (!current || current.length > 200) return bad("বর্তমান পাসওয়ার্ড দিন");
  const problem = passwordProblem(next, s.number);
  if (problem) return bad(problem);

  const { adminCollection } = await getCollections();
  const doc = await adminCollection.findOne({ number: s.number });
  if (!doc) return bad("এডমিন হিসেবে আবার সাইন ইন করুন", 401);

  const ok = doc.passwordHash
    ? await verifyPassword(current, doc.passwordHash)
    : typeof doc.password === "string" && legacyEquals(current, doc.password);
  if (!ok) return bad("বর্তমান পাসওয়ার্ড ভুল", 401);
  if (current === next)
    return bad("নতুন পাসওয়ার্ড আগেরটির থেকে আলাদা হতে হবে");

  const sv = (Number(doc.sv) || 0) + 1;
  await adminCollection.updateOne(
    { number: s.number },
    {
      $set: {
        passwordHash: await hashPassword(next),
        updatedAt: new Date(),
        updatedBy: s.number,
      },
      $unset: { password: "" },
      $inc: { sv: 1 },
    },
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie(signSession(s.number, sv)));
  return res;
}
