"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import usePendingQueue from "@/hooks/usePendingQueue";
import { QUEUED_TEXT, applyPendingToShop } from "@/lib/offlineQueue";
import {
  BN_MONTHS,
  dateTimeBn,
  dhakaYear,
  fmt,
  monthsBn,
  rentDue,
} from "@/lib/rent";

const btn =
  "flex-1 rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-60";
const DAY = 24 * 60 * 60 * 1000;

const Sheet = ({ children, onClose, z = "z-50" }) => (
  <div
    className={`fixed inset-0 ${z} flex items-end justify-center bg-black/50 sm:items-center sm:p-4`}
    onClick={onClose}
  >
    <div
      className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const Field = ({ label, name, defaultValue, inputMode, required }) => (
  <label className="block text-xs font-medium text-slate-500">
    {label}
    <input
      name={name}
      defaultValue={defaultValue ?? ""}
      inputMode={inputMode}
      required={required}
      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#0f3d2e] focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20"
    />
  </label>
);

const Stat = ({ label, value, onClick, red }) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className="px-2 py-2 text-center border rounded-lg border-slate-200"
    >
      <span className="block text-[11px] text-slate-500">{label}</span>
      <span
        className={`block text-base font-bold tabular-nums ${red ? "text-rose-600" : "text-[#8a6420]"}`}
      >
        {value}
      </span>
    </Tag>
  );
};

const Chip = ({ label, paid, canPay, onPay, children }) => (
  <div
    className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 ${
      paid
        ? "border-[#2f7d57]/30 bg-[#2f7d57]/10"
        : "border-rose-200 bg-rose-50"
    }`}
  >
    <span className="flex items-center min-w-0 gap-2 text-sm font-semibold text-slate-800">
      {children}
      <span className="truncate">{label}</span>
    </span>
    <button
      type="button"
      disabled={paid || !canPay}
      onClick={onPay}
      aria-label={paid ? "পরিশোধিত" : "পরিশোধ করুন"}
      className={`h-7 w-7 shrink-0 rounded-md text-sm text-white ${paid ? "bg-[#2f7d57]" : "bg-rose-500"}`}
    >
      {paid ? "✓" : "✕"}
    </button>
  </div>
);

export default function RentDetailsModal({ shop, onClose }) {
  const axiosPublic = useAxiosPublic();
  const qc = useQueryClient();

  const [prev, setPrev] = useState(false);
  const [months, setMonths] = useState([]);
  const [withDue, setWithDue] = useState(false);
  const [dueInput, setDueInput] = useState("");
  const [payDueInput, setPayDueInput] = useState("");
  const [dialog, setDialog] = useState(null);
  const [showBreak, setShowBreak] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // Opens instantly with the row data from the list, then updates with fresh data.
  const { data } = useQuery({
    queryKey: ["shopKeeper", shop._id],
    queryFn: async () =>
      (await axiosPublic.get(`/shopKeeper/${shop._id}`)).data,
    placeholderData: shop,
    refetchOnWindowFocus: false,
  });
  // a payment that is still waiting to sync already counts as paid here
  const pendingQ = usePendingQueue();
  const s = useMemo(
    () => applyPendingToShop(data ?? shop, pendingQ),
    [data, shop, pendingQ],
  );
  const src = prev ? s.prevYear || {} : s;

  const { data: history = [], isPending: historyLoading } = useQuery({
    queryKey: ["rentPayments", shop._id],
    enabled: showHistory,
    queryFn: async () =>
      (await axiosPublic.get(`/rent-payment?shopId=${shop._id}`)).data,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // ---- calculations ----
  const year = new Date().getFullYear();
  const { rate, unpaidNow, monthsAmt, prevDue, total: totalDue } = rentDue(s);
  const pm = s.PayMonths || [];
  const unpaidAll = pm
    .filter((m) => m.status === "unpaid")
    .map((m) => m.monthName);

  const monthlyAmt = months.length * rate;
  const dueAmount = withDue ? Number(dueInput || 0) : 0;
  const dueInvalid = withDue && !(dueAmount > 0 && dueAmount <= prevDue);
  const total = monthlyAmt + (dueInvalid ? 0 : dueAmount);
  const noRate = rate <= 0;

  // ---- helpers ----
  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 1800);
  };
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["shopKeeper", shop._id] });
    qc.invalidateQueries({ queryKey: ["shopKeepers"] });
    qc.invalidateQueries({ queryKey: ["rentPayments", shop._id] });
  };
  const done = (text) => {
    refresh();
    setDialog(null);
    flash(text);
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
    } finally {
      setBusy(false);
    }
  };

  // one request for everything: a single month, many months, an old due, or a mix
  const submitPayment = (payload, amount) =>
    run(async () => {
      const res = await axiosPublic.post("/rent-payment", {
        shopId: s._id,
        name: s.NameBn,
        ...payload,
      });
      // the server sends the SMS; the WhatsApp receipt is sent from here
      // (offline: the server sends it itself when the payment syncs)
      if (res?.data?.slipId && s.Number) {
        axiosPublic
          .post("/whatsapp/payment", {
            to: s.Number,
            total_amount: amount,
            slipId: res.data.slipId,
          })
          .catch(() => {});
      }
      setMonths([]);
      setWithDue(false);
      setDueInput("");
      done(res?.data?.queued ? QUEUED_TEXT : "পরিশোধ সম্পন্ন হয়েছে");
    });

  const payMonth = (monthName) =>
    submitPayment({ monthly: { months: [monthName], amount: rate } }, rate);

  const payDue = () => {
    const amt = Number(payDueInput);
    if (!(amt > 0) || amt > prevDue) return flash("সঠিক টাকার অংক দিন", false);
    return submitPayment({ due: { amount: amt } }, amt);
  };

  const payAll = () => {
    if (total <= 0 || dueInvalid) return;
    return submitPayment(
      {
        monthly: months.length ? { months, amount: monthlyAmt } : null,
        due: dueAmount > 0 ? { amount: dueAmount } : null,
      },
      total,
    );
  };

  const saveShop = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    run(async () => {
      const res = await axiosPublic.patch(`/editShopKeeper/${s._id}`, {
        NameBn: f.get("NameBn"),
        Name: f.get("Name"),
        Number: f.get("Number"),
        Rent: f.get("Rent"),
        Due: f.get("Due"),
      });
      if (res.data.queued || res.data.matchedCount > 0)
        done(res.data.queued ? QUEUED_TEXT : "সেইভ করা হয়েছে");
    });
  };

  const revert = () =>
    run(async () => {
      await axiosPublic.patch(`/rent-payment/${dialog.payment._id}/revert`);
      done("পেমেন্ট বাতিল করা হয়েছে");
    });

  const toggleMonth = (name) =>
    setMonths((p) =>
      p.includes(name) ? p.filter((m) => m !== name) : [...p, name],
    );

  const canRevert = (p) =>
    !p.reverted &&
    p.year === dhakaYear() &&
    Date.now() - new Date(p.createdAt).getTime() <= DAY;

  const confirmAction = {
    month: () => payMonth(dialog?.month),
    due: payDue,
    all: payAll,
    revert,
  }[dialog?.type];
  const checkbox = "h-4 w-4 accent-[#2f7d57]";

  return (
    <>
      <Sheet onClose={onClose}>
        <div className="relative bg-[#0f3d2e] p-5 text-white">
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="absolute w-8 h-8 rounded-full right-3 top-3 bg-white/15 hover:bg-white/25"
          >
            ✕
          </button>
          <p className="text-xs text-white/70">
            ইসলামপুর জামে মসজিদ, দোকান ভাড়া
          </p>
          <h2 className="mt-1 text-xl font-bold">{s.NameBn}</h2>
          <p className="text-sm text-white/80">
            {s.Number || s.Name || "দোকানদার"}
            <button
              onClick={() => setDialog({ type: "edit" })}
              className="ml-3 text-xs underline"
            >
              এডিট
            </button>
          </p>
        </div>

        <div className="flex p-1 mx-4 mt-4 text-sm font-semibold rounded-lg bg-slate-100">
          {[false, true].map((p) => (
            <button
              key={String(p)}
              onClick={() => setPrev(p)}
              className={`flex-1 rounded-md py-1.5 ${prev === p ? "bg-white text-[#0f3d2e] shadow" : "text-slate-500"}`}
            >
              {p ? year - 1 : year}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 pt-4">
          <Stat label="মাসিক ভাড়া" value={`৳${fmt(src.Rent)}`} />
          <Stat
            label={prev ? "বকেয়া" : "বকেয়া (বিস্তারিত)"}
            value={`৳${fmt(prev ? src.Due : totalDue)}`}
            red
            onClick={prev ? undefined : () => setShowBreak((v) => !v)}
          />
        </div>

        {showBreak && !prev && (
          <p className="p-3 mx-4 mt-2 text-sm leading-6 rounded-lg bg-slate-50 text-slate-700">
            আগের বছরের: ৳{fmt(prevDue)}
            <br />
            এই বছরের ({unpaidNow} মাস): ৳{fmt(monthsAmt)}
            <br />
            <b>মোট: ৳{fmt(totalDue)}</b>
          </p>
        )}

        {noRate && !prev && (
          <p className="p-3 mx-4 mt-2 text-sm rounded-lg bg-amber-50 text-amber-800">
            মাসিক ভাড়ার পরিমাণ দেওয়া নেই। পেমেন্ট নিতে আগে “এডিট” থেকে ভাড়া
            দিন।
          </p>
        )}

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700">মাসিক ভাড়া</h3>
            {!prev && !noRate && unpaidAll.length > 0 && (
              <button
                className="text-xs text-[#0f3d2e] underline"
                onClick={() =>
                  setMonths(months.length === unpaidAll.length ? [] : unpaidAll)
                }
              >
                {months.length === unpaidAll.length
                  ? "সব বাদ দিন"
                  : "সব মাস সিলেক্ট করুন"}
              </button>
            )}
          </div>

          {prev && (src.PayMonths || []).length === 0 ? (
            <p className="py-4 text-sm text-center text-slate-500">
              আগের বছরের তথ্য নেই
            </p>
          ) : (
            <div className="grid grid-flow-col grid-rows-6 gap-2">
              {(src.PayMonths || []).map((m) => (
                <Chip
                  key={m.monthName}
                  label={BN_MONTHS[m.monthName] || m.monthName}
                  paid={m.status === "paid"}
                  canPay={!prev && !noRate}
                  onPay={() => setDialog({ type: "month", month: m.monthName })}
                >
                  {!prev && !noRate && m.status === "unpaid" && (
                    <input
                      type="checkbox"
                      className={checkbox}
                      checked={months.includes(m.monthName)}
                      onChange={() => toggleMonth(m.monthName)}
                    />
                  )}
                </Chip>
              ))}
            </div>
          )}

          {!prev && prevDue > 0 && (
            <div className="mt-3 space-y-2">
              <Chip
                label={`বকেয়া ৳${fmt(prevDue)}`}
                paid={false}
                canPay
                onPay={() => {
                  setPayDueInput(String(prevDue));
                  setDialog({ type: "due" });
                }}
              >
                <input
                  type="checkbox"
                  className={checkbox}
                  checked={withDue}
                  onChange={(e) => {
                    setWithDue(e.target.checked);
                    setDueInput(e.target.checked ? String(prevDue) : "");
                  }}
                />
              </Chip>
              {withDue && (
                <>
                  <input
                    type="number"
                    min="1"
                    max={prevDue}
                    value={dueInput}
                    onChange={(e) => setDueInput(e.target.value)}
                    placeholder="কত টাকা দিচ্ছেন?"
                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300"
                  />
                  {dueInvalid && (
                    <p className="text-xs text-rose-600">
                      ১ থেকে ৳{fmt(prevDue)} এর মধ্যে টাকা দিন
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* payment history + undo */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="text-xs font-semibold text-[#0f3d2e] underline"
          >
            {showHistory ? "পেমেন্টের ইতিহাস লুকান" : "পেমেন্টের ইতিহাস দেখুন"}
          </button>
          {showHistory && (
            <ul className="mt-2 border divide-y rounded-lg divide-slate-100 border-slate-200">
              {historyLoading ? (
                <li className="p-3 text-sm text-center text-slate-500">
                  লোড হচ্ছে…
                </li>
              ) : history.length === 0 ? (
                <li className="p-3 text-sm text-center text-slate-500">
                  কোনো পেমেন্ট নেই
                </li>
              ) : (
                history.map((p) => (
                  <li
                    key={p._id}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <div className={p.reverted ? "opacity-60" : ""}>
                      <p
                        className={`text-sm font-semibold text-slate-800 ${p.reverted ? "line-through" : ""}`}
                      >
                        {p.type === "Monthly"
                          ? `ভাড়া: ${monthsBn(p.months)}`
                          : "বকেয়া ভাড়া"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {dateTimeBn(p.createdAt)}
                        {p.reverted && (
                          <span className="ml-2 font-semibold text-rose-600">
                            বাতিল
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-sm font-bold tabular-nums text-slate-800 ${p.reverted ? "line-through opacity-60" : ""}`}
                      >
                        ৳{fmt(p.fee)}
                      </span>
                      {canRevert(p) && (
                        <button
                          onClick={() =>
                            setDialog({ type: "revert", payment: p })
                          }
                          className="px-2 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-600"
                        >
                          বাতিল
                        </button>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {!prev && total > 0 && (
          <div className="sticky bottom-0 flex items-center justify-between p-3 bg-white border-t">
            <span className="text-sm font-semibold text-slate-700">
              মোট ৳{fmt(total)}
            </span>
            <button
              disabled={dueInvalid}
              onClick={() => setDialog({ type: "all" })}
              className="rounded-lg bg-[#0f3d2e] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              সব পেইড?
            </button>
          </div>
        )}
      </Sheet>

      {dialog && (
        <Sheet z="z-[60]" onClose={() => setDialog(null)}>
          {dialog.type === "edit" ? (
            <form onSubmit={saveShop} className="p-5 space-y-3">
              <Field
                label="নাম"
                name="NameBn"
                defaultValue={s.NameBn}
                required
              />
              <Field label="নাম ইংরেজি" name="Name" defaultValue={s.Name} />
              <Field
                label="নাম্বার"
                name="Number"
                defaultValue={s.Number}
                inputMode="tel"
              />
              <Field
                label="মাসিক ভাড়া"
                name="Rent"
                defaultValue={s.Rent}
                inputMode="decimal"
                required
              />
              <Field
                label="আগের বকেয়া ভাড়া"
                name="Due"
                defaultValue={s.Due ?? 0}
                inputMode="decimal"
                required
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className={`${btn} bg-slate-100 text-slate-700`}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className={`${btn} bg-[#0f3d2e] text-white`}
                >
                  {busy ? "…" : "সেইভ"}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-5 space-y-4 text-sm text-center">
              {dialog.type === "all" ? (
                <div className="space-y-0.5">
                  {months.length > 0 && (
                    <p>
                      {months.length} মাসের ৳{fmt(monthlyAmt)} টাকা
                    </p>
                  )}
                  {dueAmount > 0 && <p>বকেয়ার ৳{fmt(dueAmount)} টাকা</p>}
                  <p className="pt-2 mt-1 font-semibold border-t">
                    মোট ৳{fmt(total)} টাকা ভাড়া দেয়ার ব্যাপারটা আপনি কি
                    নিশ্চিত?
                  </p>
                </div>
              ) : dialog.type === "due" ? (
                <>
                  <p>আগের বকেয়া ভাড়া কত টাকা পরিশোধ করছেন?</p>
                  <input
                    type="number"
                    min="1"
                    max={prevDue}
                    value={payDueInput}
                    onChange={(e) => setPayDueInput(e.target.value)}
                    className="w-full px-3 py-2 text-center border rounded-lg border-slate-300"
                  />
                </>
              ) : dialog.type === "revert" ? (
                <p className="leading-6">
                  {dialog.payment.type === "Monthly"
                    ? monthsBn(dialog.payment.months)
                    : "বকেয়া ভাড়া"}{" "}
                  — ৳{fmt(dialog.payment.fee)} এর এই পেমেন্টটি বাতিল করবেন?
                  <br />
                  <span className="text-xs text-slate-500">
                    মাস/বকেয়া আবার “অপরিশোধিত” হবে এবং দোকানদারকে SMS যাবে।
                  </span>
                </p>
              ) : (
                <p>
                  {BN_MONTHS[dialog.month] || dialog.month} মাসের ৳{fmt(rate)}{" "}
                  টাকা ভাড়া দেয়ার ব্যাপারটা আপনি কি নিশ্চিত?
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setDialog(null)}
                  className={`${btn} bg-rose-50 text-rose-600`}
                >
                  না
                </button>
                <button
                  disabled={busy}
                  onClick={confirmAction}
                  className={`${btn} bg-[#2f7d57] text-white`}
                >
                  {busy ? "…" : "হ্যাঁ"}
                </button>
              </div>
            </div>
          )}
        </Sheet>
      )}

      {msg && (
        <div
          role="status"
          className={`fixed left-1/2 top-4 z-[70] -translate-x-1/2 rounded-full px-4 py-2 text-sm text-white shadow-lg ${
            msg.ok ? "bg-[#2f7d57]" : "bg-rose-600"
          }`}
        >
          {msg.text}
        </div>
      )}
    </>
  );
}
