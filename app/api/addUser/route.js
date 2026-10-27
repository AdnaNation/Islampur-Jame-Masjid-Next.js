import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { bad, MONTHS, num, str } from "@/lib/validate";

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const b = await request.json().catch(() => null);
  if (!b || typeof b !== "object") return bad();

  // only these fields are ever stored (no "admin: true" style surprises)
  const Name = str(b.Name, 100);
  const NameBn = str(b.NameBn, 100);
  const Number = str(b.Number, 20);
  const HomeName = str(b.HomeName, 100);
  if (!NameBn || !HomeName) return bad("নাম ও বাড়ির নাম দিন");

  const paid = new Set(
    (Array.isArray(b.PayMonths) ? b.PayMonths : [])
      .filter((m) => m?.status === "paid")
      .map((m) => m.monthName),
  );
  const addedUser = {
    Name,
    NameBn,
    Number,
    HomeName,
    Due: num(b.Due) ?? 0,
    Tarabi: {
      fee: num(b.Tarabi?.fee) ?? 0,
      status: b.Tarabi?.status === "paid" ? "paid" : "unpaid",
      active: b.Tarabi?.active === true,
    },
    FeeRate: num(b.FeeRate) ?? 0,
    PayMonths: MONTHS.map((monthName) => ({
      monthName,
      status: paid.has(monthName) ? "paid" : "unpaid",
    })),
  };

  const { userCollection } = await getCollections();
  const existingUser = await userCollection.findOne({
    Number: addedUser.Number,
    HomeName: addedUser.HomeName,
    Name: addedUser.Name,
  });
  if (existingUser) {
    return NextResponse.json({ message: "user already exists", insertedId: null });
  }
  const result = await userCollection.insertOne(addedUser);
  return NextResponse.json(result);
}
