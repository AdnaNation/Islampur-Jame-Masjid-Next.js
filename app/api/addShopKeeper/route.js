import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { bad, MONTHS, num, str } from "@/lib/validate";

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const b = await request.json().catch(() => null);
  if (!b || typeof b !== "object") return bad();

  const NameBn = str(b.NameBn, 100);
  if (!NameBn) return bad("নাম দিন");

  const paid = new Set(
    (Array.isArray(b.PayMonths) ? b.PayMonths : [])
      .filter((m) => m?.status === "paid")
      .map((m) => m.monthName),
  );
  const addedUser = {
    Name: str(b.Name, 100),
    NameBn,
    Number: str(b.Number, 20),
    Rent: num(b.Rent, 0) ?? 0,
    Due: num(b.Due) ?? 0,
    PayMonths: MONTHS.map((monthName) => ({
      monthName,
      status: paid.has(monthName) ? "paid" : "unpaid",
    })),
  };

  const { shopKeeperCollection } = await getCollections();
  const existingUser = await shopKeeperCollection.findOne({ NameBn });
  if (existingUser) {
    return NextResponse.json({ message: "user already exists", insertedId: null });
  }
  const result = await shopKeeperCollection.insertOne(addedUser);
  return NextResponse.json(result);
}
