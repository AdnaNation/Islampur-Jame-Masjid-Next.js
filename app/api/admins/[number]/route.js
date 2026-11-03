import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { adminSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { hashPassword } from "@/lib/password.mjs";
import { bad } from "@/lib/validate";
import {
  ROLES,
  cleanName,
  isLoginNumber,
  passwordProblem,
  publicAdmin,
  roleFlags,
} from "@/lib/adminAccounts";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const a = await adminSession(request);
  if (a.error) return a.error;
  const limited = await rateLimit(request, {
    name: "admins-write",
    key: a.session.number,
    limit: 30,
    windowSec: 60,
  });
  if (limited) return limited;

  const { number } = await params;
  if (!isLoginNumber(number)) return bad("ভুল নাম্বার");
  const b = await request.json().catch(() => null);
  if (!b || typeof b !== "object") return bad();

  const { adminCollection } = await getCollections();
  const target = await adminCollection.findOne(
    { number },
    { projection: { _id: 1 } },
  );
  if (!target) return bad("খুঁজে পাওয়া যায়নি", 404);

  const self = number === a.session.number;
  const set = { updatedAt: new Date(), updatedBy: a.session.number };
  let signOut = false;

  if ("name" in b) {
    const name = cleanName(b.name);
    if (!name) return bad("নাম দিন");
    set.name = name;
  }
  if ("role" in b) {
    if (self) return bad("নিজের ভূমিকা নিজে বদলানো যাবে না", 403);
    if (!ROLES.includes(b.role)) return bad();
    Object.assign(set, roleFlags(b.role));
    signOut = true;
  }
  if ("password" in b) {
    if (self)
      return bad(
        'নিজের পাসওয়ার্ড বদলাতে ওপরের "আমার পাসওয়ার্ড" অংশ ব্যবহার করুন',
        403,
      );
    const problem = passwordProblem(b.password, number);
    if (problem) return bad(problem);
    set.passwordHash = await hashPassword(b.password);
    signOut = true;
  }

  const update = { $set: set };
  if ("password" in b) update.$unset = { password: "" };
  if (signOut) update.$inc = { sv: 1 };
  await adminCollection.updateOne({ number }, update);

  const fresh = await adminCollection.findOne({ number });
  return NextResponse.json({
    ok: true,
    admin: publicAdmin(fresh, a.session.number),
  });
}

// ADMIN ONLY: remove a person's access completely
export async function DELETE(request, { params }) {
  const a = await adminSession(request);
  if (a.error) return a.error;
  const limited = await rateLimit(request, {
    name: "admins-write",
    key: a.session.number,
    limit: 30,
    windowSec: 60,
  });
  if (limited) return limited;

  const { number } = await params;
  if (!isLoginNumber(number)) return bad("ভুল নাম্বার");
  if (number === a.session.number) return bad("নিজেকে মুছে ফেলা যাবে না", 403);

  const { adminCollection } = await getCollections();
  const gone = await adminCollection.findOneAndDelete({ number });
  if (!gone) return bad("খুঁজে পাওয়া যায়নি", 404);
  return NextResponse.json({ ok: true });
}
