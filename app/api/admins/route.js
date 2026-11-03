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

let indexReady = false;
async function ensureUniqueNumber(c) {
  if (indexReady) return;
  indexReady = true;
  try {
    await c.createIndex({ number: 1 }, { unique: true });
  } catch {
    indexReady = false;
  }
}

export async function GET(request) {
  const a = await adminSession(request);
  if (a.error) return a.error;

  const { adminCollection } = await getCollections();
  const docs = await adminCollection
    .find(
      {},
      {
        projection: {
          number: 1,
          name: 1,
          admin: 1,
          moderator: 1,
          passwordHash: 1,
          createdAt: 1,
        },
      },
    )
    .toArray();
  const rank = { admin: 0, moderator: 1, none: 2 };
  const list = docs
    .map((d) => publicAdmin(d, a.session.number))
    .sort(
      (x, y) => rank[x.role] - rank[y.role] || x.number.localeCompare(y.number),
    );
  return NextResponse.json(list);
}

// ADMIN ONLY: add an admin or a moderator
export async function POST(request) {
  const a = await adminSession(request);
  if (a.error) return a.error;
  const limited = await rateLimit(request, {
    name: "admins-write",
    key: a.session.number,
    limit: 30,
    windowSec: 60,
  });
  if (limited) return limited;

  const b = await request.json().catch(() => null);
  if (!b || typeof b !== "object") return bad();

  const number = b.number;
  const name = cleanName(b.name);
  if (!isLoginNumber(number))
    return bad("মোবাইল নাম্বার সঠিক নয় (শুধু ৬-১৫টি সংখ্যা)");
  if (!ROLES.includes(b.role)) return bad("অ্যাডমিন না মডারেটর - বেছে নিন");
  if (!name) return bad("নাম দিন");
  const problem = passwordProblem(b.password, number);
  if (problem) return bad(problem);

  const { adminCollection } = await getCollections();
  await ensureUniqueNumber(adminCollection);
  if (await adminCollection.findOne({ number }, { projection: { _id: 1 } }))
    return bad("এই নাম্বারে আগেই একজন আছেন", 409);

  try {
    await adminCollection.insertOne({
      number,
      name,
      ...roleFlags(b.role),
      passwordHash: await hashPassword(b.password),
      sv: 0,
      createdAt: new Date(),
      createdBy: a.session.number,
    });
  } catch (e) {
    if (e?.code === 11000) return bad("এই নাম্বারে আগেই একজন আছেন", 409);
    throw e;
  }
  return NextResponse.json({ ok: true, number, role: b.role });
}
