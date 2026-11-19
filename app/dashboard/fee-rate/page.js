"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/useAxiosPublic";

const fmt = (n) => (Number(n) || 0).toLocaleString("en-IN");
const when = (v) =>
  new Date(v).toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const FeeRateChange = () => {
  const axiosPublic = useAxiosPublic();
  const qc = useQueryClient();

  const [mode, setMode] = useState("inc"); // inc | dec
  const [amountInput, setAmountInput] = useState("");
  const [amount, setAmount] = useState(0); // debounced, valid number or 0
  const [includeZero, setIncludeZero] = useState(false);
  const [confirm, setConfirm] = useState(null); // "apply" | { revert: log }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // wait until the admin stops typing before asking the server
  useEffect(() => {
    const t = setTimeout(() => {
      const n = Number(amountInput);
      setAmount(Number.isFinite(n) && n > 0 && n <= 100000 ? n : 0);
    }, 400);
    return () => clearTimeout(t);
  }, [amountInput]);

  const delta = (mode === "dec" ? -1 : 1) * amount;

  const {
    data: preview,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["feeRatePreview", delta, includeZero],
    enabled: amount > 0,
    queryFn: async () =>
      (
        await axiosPublic.get(
          `/fee-rate-change/preview?delta=${delta}&includeZero=${includeZero ? 1 : 0}`,
        )
      ).data,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["feeRateHistory"],
    queryFn: async () => (await axiosPublic.get("/fee-rate-change")).data,
    refetchOnWindowFocus: false,
  });
  const latestId = history.find((h) => !h.reverted)?._id;

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };
  const after = () => {
    qc.invalidateQueries(); // member lists everywhere must show the new rates
    setConfirm(null);
  };
  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      flash(
        err?.response?.data?.message || "ব্যর্থ হয়েছে, আবার চেষ্টা করুন",
        false,
      );
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const apply = () =>
    run(async () => {
      const res = await axiosPublic.post("/fee-rate-change", {
        delta,
        includeZero,
        expectedAffected: preview.affected,
      });
      setAmountInput("");
      setAmount(0);
      after();
      flash(`${res.data.affected} জন সদস্যের হার পরিবর্তন হয়েছে`);
    });

  const revert = (log) =>
    run(async () => {
      const res = await axiosPublic.patch(`/fee-rate-change/${log._id}/revert`);
      after();
      flash(
        res.data.skipped > 0
          ? `${res.data.restored} জনের হার আগের অবস্থায় ফিরেছে (${res.data.skipped} জনের হার পরে এডিট হয়েছে বলে বাদ)`
          : `${res.data.restored} জনের হার আগের অবস্থায় ফিরেছে`,
      );
    });

  const word = mode === "inc" ? "বাড়ানো" : "কমানো";
  const canApply = amount > 0 && preview && preview.affected > 0 && !isFetching;

  return (
    <main className="min-h-screen px-3 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f3d2e]">
            চাঁদার হার পরিবর্তন
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            সব সদস্যের মাসিক চাঁদার হার একসাথে বাড়ান বা কমান। যেমন ১০ টাকার হার
            ৫ বাড়ালে হবে ১৫, ১০০ হলে হবে ১০৫।
          </p>
        </div>

        <section className="p-4 space-y-4 bg-white border rounded-xl border-slate-200">
          <div className="flex p-1 text-sm font-semibold rounded-lg bg-slate-100">
            {[
              ["inc", "হার বাড়াবো"],
              ["dec", "হার কমাবো"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex-1 rounded-md py-2 ${
                  mode === key
                    ? "bg-white text-[#0f3d2e] shadow"
                    : "text-slate-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="block text-xs font-medium text-slate-500">
            কত টাকা {word}?
            <input
              type="number"
              min="1"
              max="100000"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="যেমন: 5"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-800 focus:border-[#0f3d2e] focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20"
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includeZero}
              onChange={(e) => setIncludeZero(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#0f3d2e]"
            />
            <span>
              যাদের হার ০ টাকা তাদেরও ধরুন
              <span className="block text-xs text-slate-500">
                বন্ধ থাকলে ০ হারের সদস্যদের (নতুন বা ছাড়প্রাপ্ত) হার বদলাবে না।
              </span>
            </span>
          </label>

          {/* live preview */}
          {amount > 0 && (
            <div className="p-3 space-y-2 text-sm rounded-lg bg-[#f4f7f3] border border-[#0f3d2e]/15">
              {isError ? (
                <p className="text-rose-600">
                  {error?.response?.data?.message || "প্রিভিউ লোড হয়নি"}
                </p>
              ) : !preview || isFetching ? (
                <p className="text-slate-500">হিসাব হচ্ছে…</p>
              ) : preview.affected === 0 ? (
                <p className="text-slate-600">
                  এই পরিবর্তনে কোনো সদস্যের হার বদলাবে না।
                </p>
              ) : (
                <>
                  <p className="font-semibold text-[#0f3d2e]">
                    {preview.affected} জন সদস্যের হার বদলাবে
                    <span className="font-normal text-slate-500">
                      {" "}
                      (মোট {preview.totalMembers} জনের মধ্যে)
                    </span>
                  </p>
                  <ul className="space-y-0.5 text-slate-700">
                    {preview.groups.slice(0, 6).map((g) => (
                      <li key={`${g.from}-${g.to}`} className="tabular-nums">
                        ৳{fmt(g.from)} → <b>৳{fmt(g.to)}</b>
                        <span className="text-slate-500"> · {g.count} জন</span>
                      </li>
                    ))}
                    {preview.groups.length > 6 && (
                      <li className="text-xs text-slate-500">
                        আরও {preview.groups.length - 6} ধরনের হার…
                      </li>
                    )}
                  </ul>
                  {preview.skippedZero > 0 && (
                    <p className="text-xs text-slate-500">
                      {preview.skippedZero} জনের হার ০, তাই বাদ থাকছে।
                    </p>
                  )}
                  {preview.clamped > 0 && (
                    <p className="text-xs text-amber-700">
                      {preview.clamped} জনের হার ০ এর নিচে নামতে পারে না, তাই ০
                      হবে।
                    </p>
                  )}
                  {preview.dueShift !== 0 && (
                    <p className="p-2 text-xs rounded-md bg-amber-50 text-amber-800">
                      <b>খেয়াল করুন:</b> যাদের আগের কিছু মাসের চাঁদা বাকি আছে,
                      সেই মাসগুলোর বকেয়াও নতুন হারে হিসাব হবে (একজনের হার এডিট
                      করলে যেমন হয়)। সব সদস্য মিলিয়ে মোট বকেয়া{" "}
                      <b>
                        ৳{fmt(Math.abs(preview.dueShift))}{" "}
                        {preview.dueShift > 0 ? "বাড়বে" : "কমবে"}
                      </b>
                      । যে মাসের চাঁদা আগেই দেওয়া হয়ে গেছে তা বদলাবে না।
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <button
            disabled={!canApply}
            onClick={() => setConfirm("apply")}
            className="w-full rounded-lg bg-[#0f3d2e] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            হার পরিবর্তন করুন
          </button>
        </section>

        <section className="bg-white border rounded-xl border-slate-200">
          <h2 className="px-4 pt-4 text-sm font-bold text-slate-700">
            আগের পরিবর্তনগুলো
          </h2>
          {history.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              এখনো কোনো পরিবর্তন করা হয়নি।
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {history.map((h) => (
                <li
                  key={h._id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className={h.reverted ? "opacity-60" : ""}>
                    <p
                      className={`text-sm font-semibold text-slate-800 ${h.reverted ? "line-through" : ""}`}
                    >
                      সবার হার ৳{fmt(Math.abs(h.delta))}{" "}
                      {h.delta > 0 ? "বাড়ানো হয়েছে" : "কমানো হয়েছে"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {when(h.at)} · {h.affected} জন
                      {h.reverted && (
                        <span className="ml-2 font-semibold text-rose-600">
                          বাতিল করা হয়েছে
                        </span>
                      )}
                    </p>
                  </div>
                  {h._id === latestId && (
                    <button
                      onClick={() => setConfirm({ revert: h })}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-50 text-rose-600 shrink-0"
                    >
                      বাতিল করুন
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          onClick={() => !busy && setConfirm(null)}
        >
          <div
            className="w-full max-w-md p-5 space-y-4 text-sm text-center bg-white shadow-2xl rounded-t-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {confirm === "apply" ? (
              <p className="leading-6">
                <b>{preview.affected} জন</b> সদস্যের মাসিক চাঁদার হার{" "}
                <b>৳{fmt(amount)}</b> {word} হবে।
                <br />
                আপনি কি নিশ্চিত?
              </p>
            ) : (
              <p className="leading-6">
                সবার হার ৳{fmt(Math.abs(confirm.revert.delta))}{" "}
                {confirm.revert.delta > 0 ? "বাড়ানোর" : "কমানোর"} এই পরিবর্তনটি
                বাতিল করে আগের হারে ফেরানো হবে। নিশ্চিত?
              </p>
            )}
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={() => setConfirm(null)}
                className="flex-1 rounded-lg bg-rose-50 py-2.5 font-semibold text-rose-600"
              >
                না
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  confirm === "apply" ? apply() : revert(confirm.revert)
                }
                className="flex-1 rounded-lg bg-[#2f7d57] py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {busy ? "…" : "হ্যাঁ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div
          role="status"
          className={`fixed left-1/2 top-4 z-[70] max-w-[92vw] -translate-x-1/2 rounded-xl px-4 py-2 text-center text-sm text-white shadow-lg ${
            msg.ok ? "bg-[#2f7d57]" : "bg-rose-600"
          }`}
        >
          {msg.text}
        </div>
      )}
    </main>
  );
};

export default FeeRateChange;
