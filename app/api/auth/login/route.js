import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { sessionCookie, signSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import {
  DUMMY_HASH,
  hashPassword,
  legacyEquals,
  verifyPassword,
} from "@/lib/password.mjs";

export const dynamic = "force-dynamic";

const FAIL = { message: "কিছু একটা ভুল আছে" };

export async function POST(request) {
  const body = await request.json().catch(() => null);
  // only plain strings: stops {"number": {"$ne": null}} style NoSQL injection
  const number = typeof body?.number === "string" ? body.number.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!/^\d{6,15}$/.test(number) || !password || password.length > 200) {
    return NextResponse.json(FAIL, { status: 401 });
  }

  // brute-force protection: per IP, per IP+number, and per number overall
  const ip = clientIp(request);
  for (const rule of [
    { name: "login-ip", key: ip, limit: 20, windowSec: 900 },
    { name: "login-pair", key: `${number}|${ip}`, limit: 5, windowSec: 900 },
    { name: "login-num", key: number, limit: 30, windowSec: 900 },
  ]) {
    const limited = await rateLimit(request, rule);
    if (limited) return limited;
  }

  const { adminCollection } = await getCollections();
  const admin = await adminCollection.findOne({ number });

  let ok = false;
  if (!admin) {
    await verifyPassword(password, DUMMY_HASH); // same timing as a real check
  } else if (admin.passwordHash) {
    ok = await verifyPassword(password, admin.passwordHash);
  } else if (typeof admin.password === "string" && admin.password) {
    // Old plain-text PIN: accept it ONE last time and replace it with a hash.
    ok = legacyEquals(password, admin.password);
    if (ok) {
      await adminCollection.updateOne(
        { _id: admin._id },
        {
          $set: { passwordHash: await hashPassword(password) },
          $unset: { password: "" },
        },
      );
    }
  }

  const allowed = admin && (admin.admin === true || admin.moderator === true);
  if (!ok || !allowed) return NextResponse.json(FAIL, { status: 401 });

  const res = NextResponse.json({
    ok: true,
    number,
    admin: admin.admin === true,
    moderator: admin.moderator === true,
  });
  res.cookies.set(sessionCookie(signSession(number)));
  return res;
}
