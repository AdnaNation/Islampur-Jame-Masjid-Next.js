import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";

export const SESSION_COOKIE = "masjid_session";
const SESSION_HOURS = 12;

function secret() {
  const s = process.env.ACCESS_TOKEN_SECRET;
  if (!s || s.length < 32)
    throw new Error("ACCESS_TOKEN_SECRET missing or too short (32+ chars)");
  return s;
}

export function signSession(number) {
  return jwt.sign({ sub: String(number) }, secret(), {
    algorithm: "HS256",
    expiresIn: `${SESSION_HOURS}h`,
  });
}

export const sessionCookie = (value) => ({
  name: SESSION_COOKIE,
  value,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: value ? SESSION_HOURS * 60 * 60 : 0,
});

// returns { number, admin, moderator } or null. Roles come from the DB every time.
export async function getSession(request) {
  const token = request.cookies?.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  let number;
  try {
    const p = jwt.verify(token, secret(), { algorithms: ["HS256"] });
    number = typeof p?.sub === "string" ? p.sub : null;
  } catch {
    return null;
  }
  if (!number) return null;

  const { adminCollection } = await getCollections();
  const doc = await adminCollection.findOne(
    { number },
    { projection: { number: 1, admin: 1, moderator: 1 } },
  );
  if (!doc) return null;
  const admin = doc.admin === true;
  const moderator = doc.moderator === true;
  if (!admin && !moderator) return null;
  return { number, admin, moderator };
}

const deny = (status) =>
  NextResponse.json(
    {
      message:
        status === 401
          ? "এডমিন হিসেবে আবার সাইন ইন করুন"
          : "এই কাজের অনুমতি নেই",
    },
    { status },
  );

// usage:  const denied = await requireAdmin(request);  if (denied) return denied;
export async function requireAdmin(request) {
  const s = await getSession(request);
  if (!s) return deny(401);
  if (!s.admin) return deny(403);
  return null;
}

// admin OR moderator
export async function requireStaff(request) {
  const s = await getSession(request);
  return s ? null : deny(401);
}
