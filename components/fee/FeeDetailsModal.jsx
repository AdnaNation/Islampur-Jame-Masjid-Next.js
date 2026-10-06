"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/useAxiosPublic";

const BN = {
  January: "জানুয়ারি",
  February: "ফেব্রুয়ারি",
  March: "মার্চ",
  April: "এপ্রিল",
  May: "মে",
  June: "জুন",
  July: "জুলাই",
  August: "আগস্ট",
  September: "সেপ্টেম্বর",
  October: "অক্টোবর",
  November: "নভেম্বর",
  December: "ডিসেম্বর",
};

const btn =
  "flex-1 rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-60";

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

const Field = ({ label, name, defaultValue }) => (
  <label className="block text-xs font-medium text-slate-500">
    {label}
    <input
      name={name}
      defaultValue={defaultValue ?? ""}
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

export default function FeeDetailsModal({ user, isAdmin, tarabiOn, onClose }) {
  const axiosPublic = useAxiosPublic();
  const qc = useQueryClient();

  const [prev, setPrev] = useState(false);
  const [months, setMonths] = useState([]);
  const [withTarabi, setWithTarabi] = useState(false);
  const [withDue, setWithDue] = useState(false);
  const [dueInput, setDueInput] = useState("");
  const [payDueInput, setPayDueInput] = useState("");
  const [dialog, setDialog] = useState(null);
  const [showBreak, setShowBreak] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // Opens instantly with the row data from the list, then updates with fresh data.
  const { data } = useQuery({
    queryKey: ["user", user._id],
    queryFn: async () => (await axiosPublic.get(`/user/${user._id}`)).data,
    placeholderData: user,
    refetchOnWindowFocus: false,
  });
  const u = data ?? user;
  const src = prev ? u.prevYear || {} : u;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // ---- calculations (same rules as before) ----
  const year = new Date().getFullYear();
  const monthIdx = new Date().getMonth();
  const rate = Number(u.FeeRate) || 0;
  const tarabiFee =
    tarabiOn && u.Tarabi?.status === "unpaid" ? Number(u.Tarabi?.fee) || 0 : 0;
  const pm = u.PayMonths || [];
  const unpaidNow = pm
    .slice(0, monthIdx + 1)
    .filter((m) => m.status === "unpaid").length;
  const totalDue = unpaidNow * rate + (Number(u.Due) || 0) + tarabiFee;
  const unpaidAll = pm
    .filter((m) => m.status === "unpaid")
    .map((m) => m.monthName);

  const monthlyAmt = months.length * rate;
  const tarabiAmt = withTarabi ? tarabiFee : 0;
  const dueAmount = withDue ? Number(dueInput || 0) : 0;
  const total = monthlyAmt + tarabiAmt + dueAmount;

  // ---- helpers ----
  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 1500);
  };
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["user", user._id] });
    qc.invalidateQueries({ queryKey: ["users"] });
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
    } catch {
      flash("ব্যর্থ হয়েছে, আবার চেষ্টা করুন", false);
    } finally {
      setBusy(false);
    }
  };
  const sms = (message) => {
    if (u.Number?.length === 11)
      axiosPublic.post("/sms", { number: u.Number, message });
  };
  const record = (extra) =>
    axiosPublic.post("/payment", {
      userId: u._id,
      name: u.NameBn,
      home: u.HomeName,
      time: new Date().toLocaleString(),
      year,
      ...extra,
    });

  // ---- actions (same endpoints as the old page) ----
  const payMonth = (monthName) =>
    run(async () => {
      const res = await axiosPublic.patch("/monthStatus", {
        id: u._id,
        selectedMonth: monthName,
      });
      if (res.data.modifiedCount > 0) {
        record({ fee: u.FeeRate, monthName, type: "Monthly" });
        sms(
          `ইসলামপুর জামে মসজিদের ${monthName}'র মাসিক চাঁদা বাবদ ৳${u.FeeRate} পরিশোধ করেছেন।`,
        );
        done("পরিশোধ সম্পন্ন হয়েছে");
      }
    });

  const payTarabi = () =>
    run(async () => {
      const res = await axiosPublic.patch(`/tarabeePaid/${u._id}`);
      if (res.data.modifiedCount > 0) {
        record({ fee: u.Tarabi?.fee, type: "Tarabi" });
        sms(
          `আপনি তারাবীর চাঁদা বাবদ ৳${u.Tarabi?.fee} পরিশোধ করেছেন। -ইসলামপুর জামে মসজিদ`,
        );
        done("পরিশোধ সম্পন্ন হয়েছে");
      }
    });

  const payDue = () =>
    run(async () => {
      const amt = Number(payDueInput);
      if (!(amt > 0)) return flash("সঠিক টাকার অংক দিন", false);
      const res = await axiosPublic.patch(`/payDue/${u._id}`, {
        DueFee: Number(u.Due) - amt,
      });
      if (res.data.modifiedCount > 0) {
        record({ fee: amt, type: "Due" });
        sms(
          `আপনি আগের বছরের বকেয়া চাঁদা বাবদ ৳${amt} পরিশোধ করেছেন। -ইসলামপুর জামে মসজিদ`,
        );
        done("পরিশোধ সম্পন্ন হয়েছে");
      }
    });

  const payAll = () =>
    run(async () => {
      if (total === 0) return;
      await axiosPublic.post("/combined-payment", {
        userId: u._id,
        name: u.NameBn,
        home: u.HomeName,
        monthly: months.length ? { months, amount: monthlyAmt } : null,
        tarabi: tarabiAmt > 0 ? { amount: tarabiAmt } : null,
        due: dueAmount > 0 ? { amount: dueAmount } : null,
      });
      setMonths([]);
      setWithTarabi(false);
      setWithDue(false);
      setDueInput("");
      done("পরিশোধ সম্পন্ন হয়েছে");
    });

  const saveFee = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    run(async () => {
      const res = await axiosPublic.patch(`/editFee/${u._id}`, {
        FeeRate: f.get("FeeRate"),
        TarabiFee: f.get("Tarabi"),
        DueFee: f.get("Due"),
      });
      if (res.data.modifiedCount > 0) done("চাঁদা সেইভ করা হয়েছে");
    });
  };

  const saveUser = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    run(async () => {
      const res = await axiosPublic.patch(`/editUserData/${u._id}`, {
        Name: f.get("Name"),
        NameBn: f.get("NameBn"),
        HomeName: f.get("HomeName"),
        Number: f.get("Number"),
      });
      if (res.data.modifiedCount > 0) done("সেইভ করা হয়েছে");
    });
  };

  const toggleMonth = (name) =>
    setMonths((p) =>
      p.includes(name) ? p.filter((m) => m !== name) : [...p, name],
    );

  const confirmAction = {
    month: () => payMonth(dialog?.month),
    tarabi: payTarabi,
    due: payDue,
    all: payAll,
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
            ইসলামপুর জামে মসজিদ, দক্ষিণ চন্ডিপুর
          </p>
          <h2 className="mt-1 text-xl font-bold">{u.NameBn}</h2>
          <p className="text-sm text-white/80">
            {u.HomeName}
            {isAdmin && (
              <button
                onClick={() => setDialog({ type: "user" })}
                className="ml-3 text-xs underline"
              >
                এডিট
              </button>
            )}
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

        <div className="grid grid-cols-3 gap-2 px-4 pt-4">
          <Stat label="চাঁদার হার" value={`৳${src.FeeRate ?? "-"}`} />
          <Stat label="তারাবী" value={`৳${src.Tarabi?.fee ?? "-"}`} />
          <Stat
            label={prev ? "বকেয়া" : "বকেয়া (বিস্তারিত)"}
            value={`৳${prev ? (src.Due ?? 0) : totalDue}`}
            red
            onClick={prev ? undefined : () => setShowBreak((s) => !s)}
          />
        </div>

        {showBreak && !prev && (
          <p className="p-3 mx-4 mt-2 text-sm leading-6 rounded-lg bg-slate-50 text-slate-700">
            তারাবী: ৳{tarabiFee}
            <br />
            আগের বছরের: ৳{u.Due}
            <br />
            এই বছরের: ৳{unpaidNow * rate}
            <br />
            <b>মোট: ৳{totalDue}</b>
            {isAdmin && (
              <button
                onClick={() => setDialog({ type: "fee" })}
                className="ml-3 text-xs text-[#0f3d2e] underline"
              >
                চাঁদা এডিট
              </button>
            )}
          </p>
        )}

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700">মাসিক চাঁদা</h3>
            {!prev && isAdmin && unpaidAll.length > 0 && (
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

          <div className="grid grid-flow-col grid-rows-6 gap-2">
            {(src.PayMonths || []).map((m) => (
              <Chip
                key={m.monthName}
                label={BN[m.monthName] || m.monthName}
                paid={m.status === "paid"}
                canPay={isAdmin && !prev}
                onPay={() => setDialog({ type: "month", month: m.monthName })}
              >
                {!prev && isAdmin && m.status === "unpaid" && (
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

          <div className="mt-3 space-y-2">
            <Chip
              label="তারাবী"
              paid={src.Tarabi?.status === "paid"}
              canPay={isAdmin && !prev}
              onPay={() => setDialog({ type: "tarabi" })}
            >
              {!prev &&
                isAdmin &&
                tarabiOn &&
                u.Tarabi?.status === "unpaid" && (
                  <input
                    type="checkbox"
                    className={checkbox}
                    checked={withTarabi}
                    onChange={(e) => setWithTarabi(e.target.checked)}
                  />
                )}
            </Chip>

            {!prev && Number(u.Due) > 0 && (
              <>
                <Chip
                  label={`বকেয়া ৳${u.Due}`}
                  paid={false}
                  canPay={isAdmin}
                  onPay={() => {
                    setPayDueInput(String(u.Due));
                    setDialog({ type: "due" });
                  }}
                >
                  {isAdmin && (
                    <input
                      type="checkbox"
                      className={checkbox}
                      checked={withDue}
                      onChange={(e) => {
                        setWithDue(e.target.checked);
                        setDueInput(e.target.checked ? String(u.Due) : "");
                      }}
                    />
                  )}
                </Chip>
                {withDue && (
                  <input
                    type="number"
                    min="1"
                    value={dueInput}
                    onChange={(e) => setDueInput(e.target.value)}
                    placeholder="কত টাকা দিচ্ছেন?"
                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300"
                  />
                )}
              </>
            )}
          </div>
        </div>

        {isAdmin && !prev && total > 0 && (
          <div className="sticky bottom-0 flex items-center justify-between p-3 bg-white border-t">
            <span className="text-sm font-semibold text-slate-700">
              মোট ৳{total}
            </span>
            <button
              onClick={() => setDialog({ type: "all" })}
              className="rounded-lg bg-[#0f3d2e] px-5 py-2 text-sm font-semibold text-white"
            >
              সব পেইড?
            </button>
          </div>
        )}
      </Sheet>

      {dialog && (
        <Sheet z="z-[60]" onClose={() => setDialog(null)}>
          {dialog.type === "fee" || dialog.type === "user" ? (
            <form
              onSubmit={dialog.type === "fee" ? saveFee : saveUser}
              className="p-5 space-y-3"
            >
              {dialog.type === "fee" ? (
                <>
                  <Field
                    label="চাঁদার হার"
                    name="FeeRate"
                    defaultValue={u.FeeRate}
                  />
                  <Field
                    label="তারাবীর চাঁদা"
                    name="Tarabi"
                    defaultValue={u.Tarabi?.fee}
                  />
                  <Field
                    label="আগের বকেয়া চাঁদা"
                    name="Due"
                    defaultValue={u.Due}
                  />
                </>
              ) : (
                <>
                  <Field label="নাম" name="NameBn" defaultValue={u.NameBn} />
                  <Field label="নাম ইংরেজি" name="Name" defaultValue={u.Name} />
                  <Field
                    label="বাড়ির নাম"
                    name="HomeName"
                    defaultValue={u.HomeName}
                  />
                  <Field
                    label="নাম্বার"
                    name="Number"
                    defaultValue={u.Number}
                  />
                </>
              )}
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
                      {months.length} মাসের ৳{monthlyAmt} টাকা
                    </p>
                  )}
                  {tarabiAmt > 0 && <p>তারাবীর ৳{tarabiAmt} টাকা</p>}
                  {dueAmount > 0 && <p>বকেয়ার ৳{dueAmount} টাকা</p>}
                  <p className="pt-2 mt-1 font-semibold border-t">
                    মোট ৳{total} টাকা চাঁদা দেয়ার ব্যাপারটা আপনি কি নিশ্চিত?
                  </p>
                </div>
              ) : dialog.type === "due" ? (
                <>
                  <p>আগের বছরের বকেয়া কত টাকা পরিশোধ করছেন?</p>
                  <input
                    type="number"
                    min="1"
                    value={payDueInput}
                    onChange={(e) => setPayDueInput(e.target.value)}
                    className="w-full px-3 py-2 text-center border rounded-lg border-slate-300"
                  />
                </>
              ) : dialog.type === "tarabi" ? (
                <p>
                  তারাবীর ৳{u.Tarabi?.fee} টাকা চাঁদা দেয়ার ব্যাপারটা আপনি কি
                  নিশ্চিত?
                </p>
              ) : (
                <p>
                  {BN[dialog.month] || dialog.month} মাসের ৳{u.FeeRate} টাকা
                  চাঁদা দেয়ার ব্যাপারটা আপনি কি নিশ্চিত?
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
