const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const r2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

// Apply advance to carried dues first, then complete unpaid months in calendar order.
// Tarabi is deliberately excluded.
export function planAdvanceUse(user) {
  let advance = r2(Math.max(0, Number(user?.Advance) || 0));
  if (advance <= 0) return null;

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

  if (dueUsed === 0 && months.length === 0) return null;
  return { dueUsed, months, monthsUsed, newDue: due, newAdvance: advance };
}
