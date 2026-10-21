import { NextResponse } from "next/server";
import {
  getAccountCollections,
  dhakaStart,
  dhakaEnd,
  validDate,
  memberFeeSummary,
  mergeMemberRow,
} from "@/lib/accounts";

const r2 = (n) => Math.round(n * 100) / 100;

export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const from = dhakaStart(sp.get("from"));
  const to = dhakaEnd(sp.get("to"));
  if (!validDate(from) || !validDate(to) || from > to)
    return NextResponse.json({ message: "সঠিক তারিখ দিন" }, { status: 400 });

  const fromYmd = sp.get("from");
  const toYmd = sp.get("to");
  const { transactionCollection } = await getAccountCollections();
  const [grouped, before, member] = await Promise.all([
    transactionCollection
      .aggregate([
        { $match: { date: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { type: "$type", categoryId: "$categoryId" },
            name: { $first: "$categoryName" },
            total: { $sum: "$amount" },
          },
        },
      ])
      .toArray(),
    transactionCollection
      .aggregate([
        { $match: { date: { $lt: from } } },
        { $group: { _id: "$type", total: { $sum: "$amount" } } },
      ])
      .toArray(),
    memberFeeSummary(fromYmd, toYmd),
  ]);

  grouped.sort((a, b) =>
    String(a._id.categoryId).localeCompare(String(b._id.categoryId)),
  );
  const rows = (type) =>
    grouped
      .filter((g) => g._id.type === type)
      .map((g) => ({ name: g.name, total: r2(g.total) }));
  const income = mergeMemberRow(rows("income"), member.total);
  const expense = rows("expense");
  const beforeOf = (type) => before.find((b) => b._id === type)?.total || 0;

  return NextResponse.json({
    opening: r2(beforeOf("income") + member.before - beforeOf("expense")),
    income,
    expense,
    totalIncome: r2(income.reduce((a, r) => a + r.total, 0)),
    totalExpense: r2(expense.reduce((a, r) => a + r.total, 0)),
    memberFees: {
      monthly: member.monthly,
      tarabi: member.tarabi,
      due: member.due,
      total: member.total,
    },
  });
}
