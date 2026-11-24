const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const r2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

function normalizeLots(user, balance) {
  const existing = Array.isArray(user?.AdvanceLots) ? user.AdvanceLots : [];
  const lots = existing
    .map((lot) => ({
      paymentId: lot.paymentId || null,
      amount: r2(Math.max(0, Number(lot.amount) || 0)),
      remaining: r2(Math.max(0, Number(lot.remaining) || 0)),
      ...(lot.receivedAt ? { receivedAt: lot.receivedAt } : {}),
      ...(lot.legacy ? { legacy: true } : {}),
    }))
    .filter((lot) => lot.remaining > 0);

  const tracked = r2(lots.reduce((sum, lot) => sum + lot.remaining, 0));
  if (tracked < balance) {
    const untracked = r2(balance - tracked);
    lots.unshift({
      paymentId: null,
      amount: untracked,
      remaining: untracked,
      legacy: true,
    });
  }

  // If old data is inconsistent, cap tracked lots to the authoritative balance.
  let available = balance;
  return lots
    .map((lot) => {
      const remaining = r2(Math.min(lot.remaining, available));
      available = r2(available - remaining);
      return { ...lot, remaining };
    })
    .filter((lot) => lot.remaining > 0);
}

// Apply advance to carried dues first, then complete unpaid months in calendar order.
// FIFO lots preserve which receipt funded the balance, so a used receipt cannot be reversed
// merely because a later deposit replenished the member's total advance.
export function planAdvanceUse(user) {
  const startingAdvance = r2(Math.max(0, Number(user?.Advance) || 0));
  if (startingAdvance <= 0) return null;

  let advance = startingAdvance;
  let due = r2(Math.max(0, Number(user?.Due) || 0));
  const dueUsed = r2(Math.min(advance, due));
  due = r2(due - dueUsed);
  advance = r2(advance - dueUsed);

  const rate = r2(Math.max(0, Number(user?.FeeRate) || 0));
  const unpaidSet = new Set(
    (Array.isArray(user?.PayMonths) ? user.PayMonths : [])
      .filter((month) => month?.status === "unpaid")
      .map((month) => month.monthName),
  );
  const unpaid = MONTHS.filter((month) => unpaidSet.has(month));
  const count = rate > 0
    ? Math.min(unpaid.length, Math.floor((advance + 1e-8) / rate))
    : 0;
  const months = unpaid.slice(0, count);
  const monthsUsed = r2(count * rate);
  advance = r2(advance - monthsUsed);

  const consumed = r2(dueUsed + monthsUsed);
  let remainingToConsume = consumed;
  const nextLots = [];
  const lotUses = [];
  for (const lot of normalizeLots(user, startingAdvance)) {
    const used = r2(Math.min(lot.remaining, remainingToConsume));
    const remaining = r2(lot.remaining - used);
    remainingToConsume = r2(remainingToConsume - used);
    if (used > 0) lotUses.push({ paymentId: lot.paymentId, amount: used });
    if (remaining > 0) nextLots.push({ ...lot, remaining });
  }

  return {
    dueUsed,
    months,
    monthsUsed,
    newDue: due,
    newAdvance: advance,
    advanceLots: nextLots,
    lotUses,
  };
}
