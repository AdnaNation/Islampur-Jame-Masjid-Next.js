import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { bad, isId, MONTHS } from "@/lib/validate";

export const runtime = "nodejs";

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const { userId, allocations } = body || {};
  if (!isId(userId) || !Array.isArray(allocations) || !allocations.length) {
    return bad("সদস্য ও মাসের তথ্য দিন");
  }

  const normalized = [];
  const seen = new Set();
  for (const item of allocations) {
    const month = item?.month;
    const amount = roundMoney(item?.amount);
    if (!MONTHS.includes(month) || seen.has(month) || !(amount > 0) || !Number.isFinite(amount)) {
      return bad("মাস বা টাকার পরিমাণ সঠিক নয়");
    }
    seen.add(month);
    normalized.push({ month, amount });
  }

  const { userCollection, advanceUseCollection } = await getCollections();
  const client = await clientPromise;
  const session = client.startSession();
  let response;
  try {
    await session.withTransaction(async () => {
      const query = { _id: new ObjectId(userId) };
      const user = await userCollection.findOne(query, { session });
      if (!user) {
        const error = new Error("সদস্য পাওয়া যায়নি");
        error.status = 404;
        throw error;
      }

      const balance = roundMoney(Math.max(0, Number(user.Advance) || 0));
      const requested = roundMoney(normalized.reduce((sum, item) => sum + item.amount, 0));
      if (requested > balance + 0.009) {
        const error = new Error("সমন্বয়ের পরিমাণ অগ্রিম ব্যালেন্সের চেয়ে বেশি");
        error.status = 400;
        throw error;
      }

      const payMonths = Array.isArray(user.PayMonths) ? user.PayMonths.map((m) => ({ ...m })) : [];
      for (const allocation of normalized) {
        const target = payMonths.find((m) => m.monthName === allocation.month);
        if (!target || target.status === "paid") {
          const error = new Error(`${allocation.month} মাসটি পাওয়া যায়নি অথবা ইতিমধ্যে পরিশোধিত`);
          error.status = 400;
          throw error;
        }
        const rate = roundMoney(Math.max(0, Number(user.FeeRate) || 0));
        const alreadyPaid = roundMoney(Math.min(rate, Math.max(0, Number(target.paidAmount) || 0)));
        const outstanding = roundMoney(Math.max(0, rate - alreadyPaid));
        if (allocation.amount > outstanding + 0.009) {
          const error = new Error(`${allocation.month} মাসের বকেয়ার চেয়ে বেশি সমন্বয় করা যাবে না`);
          error.status = 400;
          throw error;
        }
        target.paidAmount = roundMoney(alreadyPaid + allocation.amount);
        target.status = target.paidAmount >= rate - 0.009 ? "paid" : "partial";
      }

      let remainingToConsume = requested;
      const nextLots = [];
      const lotUses = [];
      const lots = Array.isArray(user.AdvanceLots) ? user.AdvanceLots : [];
      const tracked = roundMoney(lots.reduce((sum, lot) => sum + Math.max(0, Number(lot.remaining) || 0), 0));
      if (tracked < balance) {
        const legacy = roundMoney(balance - tracked);
        lots.unshift({ paymentId: null, amount: legacy, remaining: legacy, legacy: true });
      }
      for (const lot of lots) {
        const available = roundMoney(Math.max(0, Number(lot.remaining) || 0));
        const used = roundMoney(Math.min(available, remainingToConsume));
        const left = roundMoney(available - used);
        remainingToConsume = roundMoney(remainingToConsume - used);
        if (used > 0) lotUses.push({ paymentId: lot.paymentId || null, amount: used });
        if (left > 0) nextLots.push({ ...lot, remaining: left });
      }
      if (remainingToConsume > 0.009) throw new Error("অগ্রিমের রসিদভিত্তিক হিসাব মেলেনি");

      const updated = await userCollection.updateOne(
        { ...query, Advance: user.Advance },
        { $set: {
          Advance: roundMoney(balance - requested),
          AdvanceLots: nextLots,
          PayMonths: payMonths,
        } },
        { session },
      );
      if (!updated.modifiedCount) throw new Error("সদস্যের তথ্য পরিবর্তিত হয়েছে, আবার চেষ্টা করুন");

      const now = new Date();
      const allocationId = new ObjectId().toString();
      await advanceUseCollection.insertOne({
        _id: `manual:${allocationId}`,
        userId,
        name: user.NameBn || user.Name || "",
        year: now.getFullYear(),
        month: "manual",
        months: normalized.map((item) => item.month),
        allocations: normalized,
        monthsUsed: requested,
        dueUsed: 0,
        source: "manual-admin",
        advanceLeft: roundMoney(balance - requested),
        lotUses,
        at: now,
      }, { session });
      response = {
        success: true,
        used: requested,
        advanceLeft: roundMoney(balance - requested),
        allocations: normalized,
      };
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "অগ্রিম সমন্বয় করা যায়নি" },
      { status: error.status || 500 },
    );
  } finally {
    await session.endSession();
  }

  return NextResponse.json(response);
}
