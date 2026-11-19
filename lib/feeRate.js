export const r2 = (n) => Math.round(n * 100) / 100;

// The month we are in right now, in Dhaka time (0 = January)
export const dhakaMonthIdx = (date = new Date()) =>
  Number(
    date.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }).slice(5, 7),
  ) - 1;

export function cleanDelta(v) {
  if (v === "" || v === null || v === undefined || typeof v === "object")
    return null;
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) && n !== 0 && Math.abs(n) <= 100000 ? n : null;
}

export function planFeeChange(users, delta, includeZero, monthIdx) {
  const changes = [];
  const groups = new Map();
  let skippedZero = 0; //
  let clamped = 0;
  let dueShift = 0;

  for (const u of users) {
    const from = Number(u.FeeRate) || 0;
    if (from <= 0 && !includeZero) {
      skippedZero += 1;
      continue;
    }
    const raw = r2(from + delta);
    const to = Math.max(0, raw);
    if (to === from) continue;
    if (raw < 0) clamped += 1;

    const unpaidSoFar = (u.PayMonths || [])
      .slice(0, monthIdx + 1)
      .filter((m) => m.status === "unpaid").length;
    dueShift += unpaidSoFar * (to - from);

    changes.push({ _id: u._id, rawFrom: u.FeeRate, from, to });
    const key = `${from}>${to}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }

  return {
    changes,
    affected: changes.length,
    totalMembers: users.length,
    skippedZero,
    clamped,
    dueShift: r2(dueShift),
    groups: [...groups.entries()]
      .map(([k, count]) => {
        const [from, to] = k.split(">").map(Number);
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count),
  };
}
