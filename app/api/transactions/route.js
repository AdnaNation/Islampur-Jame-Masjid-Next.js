import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getAccountCollections,
  TYPES,
  dhakaStart,
  dhakaEnd,
  validDate,
  cleanAmount,
  memberFeeSummary,
  MEMBER_CATEGORY,
  openingAt,
} from "@/lib/accounts";
import { withIdempotency } from "@/lib/idempotency";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const sp = new URL(request.url).searchParams;
  const type = sp.get("type");
  const categoryId = sp.get("categoryId");
  const from = dhakaStart(sp.get("from"));
  const to = dhakaEnd(sp.get("to"));
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 50, 1), 500);

  const match = {};
  if (TYPES.includes(type)) match.type = type;
  if (categoryId && ObjectId.isValid(categoryId))
    match.categoryId = new ObjectId(categoryId);
  if (validDate(from) || validDate(to)) {
    match.date = {};
    if (validDate(from)) match.date.$gte = from;
    if (validDate(to)) match.date.$lte = to;
  }

  const withMembers = type !== "expense" && !match.categoryId;
  const { transactionCollection } = await getAccountCollections();
  const [items, grouped, member, opening] = await Promise.all([
    transactionCollection
      .find(match)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .toArray(),
    transactionCollection
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: { type: "$type", name: "$categoryName" },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    withMembers
      ? memberFeeSummary(sp.get("from") || undefined, sp.get("to") || undefined)
      : null,
    validDate(from) ? openingAt(sp.get("from")) : null,
  ]);

  let income = 0;
  let expense = 0;
  let count = 0;
  const byCategory = grouped
    .map((g) => {
      if (g._id.type === "income") income += g.total;
      else expense += g.total;
      count += g.count;
      return {
        type: g._id.type,
        name: g._id.name,
        total: Math.round(g.total * 100) / 100,
        count: g.count,
      };
    })
    .sort((a, b) => b.total - a.total);

  if (member && member.total > 0) {
    const detail = [
      member.monthly > 0 && `মাসিক ${member.monthly}`,
      member.tarabi > 0 && `তারাবী ${member.tarabi}`,
      member.due > 0 && `বকেয়া ${member.due}`,
    ]
      .filter(Boolean)
      .join(" • ");
    const mine = byCategory.find(
      (c) => c.type === "income" && c.name === MEMBER_CATEGORY,
    );
    if (mine) {
      mine.total = Math.round((mine.total + member.total) * 100) / 100;
      mine.count += member.count;
      mine.detail = detail;
    } else {
      byCategory.push({
        type: "income",
        name: MEMBER_CATEGORY,
        total: member.total,
        count: member.count,
        detail,
      });
    }
    income += member.total;
    byCategory.sort((a, b) => b.total - a.total);
  }

  return NextResponse.json({
    items,
    count,
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    byCategory,
    opening,
  });
}

async function createTransaction(request) {
  const body = await request.json();
  const { type, categoryId } = body;
  const amount = cleanAmount(body.amount);
  const date = dhakaStart(body.date);
  const note = String(body.note ?? "")
    .trim()
    .slice(0, 300);

  if (!TYPES.includes(type))
    return NextResponse.json({ message: "ধরন সঠিক নয়" }, { status: 400 });
  if (!amount)
    return NextResponse.json(
      { message: "সঠিক টাকার পরিমাণ দিন" },
      { status: 400 },
    );
  if (!validDate(date))
    return NextResponse.json({ message: "সঠিক তারিখ দিন" }, { status: 400 });
  if (!ObjectId.isValid(categoryId))
    return NextResponse.json(
      { message: "ক্যাটাগরি বেছে নিন" },
      { status: 400 },
    );

  const { transactionCollection, categoryCollection } =
    await getAccountCollections();
  const cat = await categoryCollection.findOne({
    _id: new ObjectId(categoryId),
  });
  if (!cat || cat.type !== type)
    return NextResponse.json(
      { message: "ক্যাটাগরি এই ধরনের জন্য সঠিক নয়" },
      { status: 400 },
    );

  const doc = {
    type,
    categoryId: cat._id,
    categoryName: cat.name,
    amount,
    date,
    note,
    createdAt: new Date(),
  };
  const result = await transactionCollection.insertOne(doc);
  return NextResponse.json({ ...doc, _id: result.insertedId });
}

// sign-in check comes first: nobody anonymous may touch the idempotency store
export const POST = async (request) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return withIdempotency(request, () => createTransaction(request));
};
