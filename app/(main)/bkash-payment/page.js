"use client";

import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useHomeName from "@/hooks/useHomeName";
import monthTranslation from "@/lib/monthTranslation";

const BKASH_NUMBER = process.env.NEXT_PUBLIC_BKASH_NUMBER;
const WHATSAPP_NUMBER = "8801776236285";

const BkashPaymentPage = () => {
  const axiosPublic = useAxiosPublic();
  const [homeName] = useHomeName();

  const [step, setStep] = useState("lookup");

  const [selectedHome, setSelectedHome] = useState("");
  const [names, setNames] = useState([]);
  const [selectedNameId, setSelectedNameId] = useState("");
  const [loadingNames, setLoadingNames] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // combined selection - any/all of these can be picked together
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [payTarabi, setPayTarabi] = useState(false);
  const [payDueChecked, setPayDueChecked] = useState(false);
  const [dueAmount, setDueAmount] = useState("");

  const [senderNumber, setSenderNumber] = useState("");
  const [trxID, setTrxID] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetSelections = () => {
    setSelectedMonths([]);
    setPayTarabi(false);
    setPayDueChecked(false);
    setDueAmount("");
    setSenderNumber("");
    setTrxID("");
  };

  const resetToLookup = () => {
    setSelectedNameId("");
    setUser(null);
    setNotFound(false);
    resetSelections();
    setStep("lookup");
  };

  const handleHomeChange = async (e) => {
    const home = e.target.value;
    setSelectedHome(home);
    setSelectedNameId("");
    setUser(null);
    setNames([]);
    setNotFound(false);
    if (!home) return;
    setLoadingNames(true);
    try {
      const res = await axiosPublic.get(`/usersName/${home}`);
      setNames(res.data || []);
    } catch {
      setNames([]);
    } finally {
      setLoadingNames(false);
    }
  };

  const handleNameChange = async (e) => {
    const id = e.target.value;
    setSelectedNameId(id);
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    resetSelections();
    try {
      const res = await axiosPublic.get(`/user/${id}`);
      if (res.data && res.data._id) {
        setUser(res.data);
        const unpaid = (res.data.PayMonths || []).filter(
          (m) => m.status === "unpaid",
        );
        const hasDue =
          unpaid.length > 0 ||
          res.data?.Tarabi?.status === "unpaid" ||
          Number(res.data?.Due) > 0;
        setStep(hasDue ? "select" : "noDue");
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const unpaidMonths = (user?.PayMonths || []).filter(
    (m) => m.status === "unpaid",
  );

  const toggleMonth = (monthName) => {
    setSelectedMonths((prev) =>
      prev.includes(monthName)
        ? prev.filter((m) => m !== monthName)
        : [...prev, monthName],
    );
  };

  const monthlyAmount = Number(user?.FeeRate || 0) * selectedMonths.length;
  const tarabiAmount = payTarabi ? Number(user?.Tarabi?.fee || 0) : 0;
  const dueAmountValue = payDueChecked ? Number(dueAmount || 0) : 0;
  const totalAmount = monthlyAmount + tarabiAmount + dueAmountValue;

  const CASHOUT_CHARGE_RATE = 0.015;
  const charge = Math.round(totalAmount * CASHOUT_CHARGE_RATE);
  const totalToSend = totalAmount + charge;

  const canContinueToConfirm = totalAmount > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(BKASH_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(String(totalToSend));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const getWhatsappLink = () => {
    const parts = ["আসসালামু আলাইকুম, আমার bKash পেমেন্টে সাহায্য দরকার।"];
    if (user) parts.push(`নামঃ ${user.NameBn} (${user.HomeName})`);
    if (totalToSend) parts.push(`পরিমাণঃ ৳${totalToSend}`);
    if (trxID) parts.push(`TrxID: ${trxID}`);
    const text = encodeURIComponent(parts.join("\n"));
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!trxID.trim() || !senderNumber.trim()) return;
    setSubmitting(true);
    try {
      await axiosPublic.post("/bkash-request", {
        userId: user._id,
        name: user.NameBn,
        home: user.HomeName,
        senderNumber: senderNumber.trim(),
        trxID: trxID.trim(),
        totalAmount,
        sentAmount: totalToSend,
        monthly:
          selectedMonths.length > 0
            ? { months: selectedMonths, amount: monthlyAmount }
            : null,
        tarabi: payTarabi ? { amount: tarabiAmount } : null,
        due:
          payDueChecked && dueAmountValue > 0
            ? { amount: dueAmountValue }
            : null,
      });
      setStep("done");
    } catch {
      Swal.fire({
        icon: "error",
        title: "কিছু একটা ভুল হয়েছে",
        text: "আবার চেষ্টা করুন",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl px-4 mx-auto my-10">
      <h1 className="mb-1 text-2xl font-bold text-center">
        bKash দিয়ে চাঁদা পরিশোধ
      </h1>
      <p className="mb-8 text-sm text-center text-gray-500">
        ইসলামপুর জামে মসজিদ
      </p>

      {/* Step 1: home + name select */}
      {step === "lookup" && (
        <div className="space-y-3">
          <label className="form-control">
            <div className="label">
              <span className="label-text">বাড়ির নাম</span>
            </div>
            <select
              value={selectedHome}
              onChange={handleHomeChange}
              className="w-full select select-bordered"
            >
              <option value="" disabled>
                বাড়ি বাছাই করুন
              </option>
              {homeName.map((home) => (
                <option key={home} value={home}>
                  {home}
                </option>
              ))}
            </select>
          </label>

          {selectedHome && (
            <label className="form-control">
              <div className="label">
                <span className="label-text">নাম</span>
              </div>
              <select
                value={selectedNameId}
                onChange={handleNameChange}
                className="w-full select select-bordered"
                disabled={loadingNames}
              >
                <option value="" disabled>
                  {loadingNames ? "লোড হচ্ছে..." : "নাম বাছাই করুন"}
                </option>
                {names.map((n) => (
                  <option key={n._id} value={n._id}>
                    {n.NameBn}
                  </option>
                ))}
              </select>
            </label>
          )}

          {loading && (
            <p className="text-sm text-center text-gray-400">
              তথ্য লোড হচ্ছে...
            </p>
          )}
          {notFound && (
            <p className="text-sm text-red-600">
              তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন।
            </p>
          )}
        </div>
      )}

      {/* No dues at all */}
      {step === "noDue" && user && (
        <div className="py-10 space-y-4 text-center">
          <p className="text-4xl">🎉</p>
          <p className="font-semibold">{user.NameBn} এর কোনো বকেয়া নেই।</p>
          <button onClick={resetToLookup} className="btn btn-outline btn-info">
            অন্য সদস্য বাছাই করুন
          </button>
        </div>
      )}

      {/* Step 2: choose what to pay - all types together */}
      {step === "select" && user && (
        <div className="space-y-4">
          <div className="p-3 text-sm border rounded-lg bg-gray-50">
            <p className="font-semibold">{user.NameBn}</p>
            <p className="text-gray-500">{user.HomeName}</p>
          </div>

          {unpaidMonths.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-semibold">
                মাসিক চাঁদা (৳{user.FeeRate}/মাস)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {unpaidMonths.map((m) => (
                  <label
                    key={m.monthName}
                    className="flex items-center gap-1 p-2 text-sm border rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(m.monthName)}
                      onChange={() => toggleMonth(m.monthName)}
                    />
                    {monthTranslation[m.monthName] || m.monthName}
                  </label>
                ))}
              </div>
            </div>
          )}

          {user.Tarabi?.status === "unpaid" && (
            <label className="flex items-center gap-2 p-2 text-sm border rounded cursor-pointer">
              <input
                type="checkbox"
                checked={payTarabi}
                onChange={(e) => setPayTarabi(e.target.checked)}
              />
              তারাবীর চাঁদা (৳{user.Tarabi?.fee})
            </label>
          )}

          {Number(user.Due) > 0 && (
            <div className="p-2 space-y-2 border rounded">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={payDueChecked}
                  onChange={(e) => {
                    setPayDueChecked(e.target.checked);
                    if (!e.target.checked) setDueAmount("");
                  }}
                />
                বকেয়া পরিশোধ (মোট বকেয়া: ৳{user.Due})
              </label>
              {payDueChecked && (
                <input
                  type="number"
                  min="1"
                  max={user.Due}
                  value={dueAmount}
                  onChange={(e) => setDueAmount(e.target.value)}
                  placeholder="কত টাকা পরিশোধ করবেন?"
                  className="w-full input input-bordered input-sm"
                />
              )}
            </div>
          )}

          {totalAmount > 0 && (
            <div className="text-lg font-semibold text-center">
              মোট পরিশোধ করবেন: ৳{totalAmount}
            </div>
          )}

          <button
            disabled={!canContinueToConfirm}
            onClick={() => setStep("confirm")}
            className="w-full btn btn-info disabled:opacity-50"
          >
            পরবর্তী ধাপ
          </button>
          <button
            onClick={resetToLookup}
            className="w-full btn btn-ghost btn-sm"
          >
            অন্য সদস্য বাছাই করুন
          </button>
        </div>
      )}

      {/* Step 3: send money + submit trxID */}
      {step === "confirm" && (
        <div className="space-y-5">
          <div className="p-3 space-y-1 text-sm border rounded-lg bg-gray-50">
            {selectedMonths.length > 0 && (
              <p>
                মাসিক চাঁদা (
                {selectedMonths.map((m) => monthTranslation[m] || m).join(", ")}
                ) - ৳{monthlyAmount}
              </p>
            )}
            {payTarabi && <p>তারাবীর চাঁদা - ৳{tarabiAmount}</p>}
            {payDueChecked && dueAmountValue > 0 && (
              <p>বকেয়া - ৳{dueAmountValue}</p>
            )}
            <p className="pt-1 font-semibold border-t">
              মোট - ৳{totalAmount} + ক্যাশআউট চার্জ (১.৫%)
            </p>
          </div>

          <div className="p-4 space-y-2 text-center border rounded-lg bg-emerald-50 border-emerald-200">
            <p className="text-sm">নিচের নাম্বারে bKash অ্যাপ থেকে</p>
            <p className="text-sm font-semibold">
              &ldquo;Send Money&rdquo; করুন
            </p>

            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-bold tracking-wide">
                ৳{totalToSend}
              </span>
              <button
                type="button"
                onClick={handleCopyAmount}
                className="btn btn-xs btn-ghost"
              >
                {copiedAmount ? <FiCheck /> : <FiCopy />}
              </button>
            </div>

            <p className="text-xs text-gray-500">
              (চাঁদা ৳{totalAmount} + ক্যাশআউট চার্জ ৳{charge})
            </p>

            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-bold tracking-wide">
                {BKASH_NUMBER}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-xs btn-ghost"
              >
                {copied ? <FiCheck /> : <FiCopy />}
              </button>
            </div>
          </div>
          <p className="text-xs text-center text-gray-500">
            টাকা পাঠানোর পর আপনার bKash অ্যাপে দেখানো Transaction ID (TrxID)
            নিচে লিখুন। অ্যাডমিন যাচাই করার পর আপনার চাঁদা আপডেট হবে।
          </p>

          <form onSubmit={handleSubmitClaim} className="space-y-3">
            <label className="form-control">
              <div className="label">
                <span className="label-text">
                  যে নাম্বার থেকে টাকা পাঠিয়েছেন
                </span>
              </div>
              <input
                type="text"
                required
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="যেমনঃ 017XXXXXXXX"
                className="w-full input input-bordered"
              />
            </label>
            <label className="form-control">
              <div className="label">
                <span className="label-text">Transaction ID (TrxID)</span>
              </div>
              <input
                type="text"
                required
                value={trxID}
                onChange={(e) => setTrxID(e.target.value)}
                placeholder="যেমনঃ 9G7H3K2L1M"
                className="w-full uppercase input input-bordered"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn btn-info"
            >
              {submitting ? "পাঠানো হচ্ছে..." : "যাচাইয়ের জন্য জমা দিন"}
            </button>
            <button
              type="button"
              onClick={() => setStep("select")}
              className="w-full btn btn-ghost btn-sm"
            >
              পিছনে যান
            </button>
          </form>

          {WHATSAPP_NUMBER && (
            <p className="text-xs text-center text-gray-500">
              পেমেন্ট নিয়ে কোনো সমস্যা হলে{" "}
              <a
                href={getWhatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-green-600 underline"
              >
                WhatsApp এ যোগাযোগ করুন
              </a>
            </p>
          )}
        </div>
      )}

      {/* Step 4: done */}
      {step === "done" && (
        <div className="py-6 space-y-4 text-center">
          <p className="text-3xl">✅</p>
          <p className="font-semibold">ধন্যবাদ!</p>
          <p className="text-sm text-gray-500">
            আপনার তথ্য জমা হয়েছে। অ্যাডমিন যাচাই করার পর আপনার চাঁদা আপডেট হবে।
          </p>
          <button onClick={resetToLookup} className="btn btn-outline btn-info">
            আরেকজনের জন্য পরিশোধ করুন
          </button>
        </div>
      )}

      {WHATSAPP_NUMBER && (
        <a
          href={getWhatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed z-50 flex items-center gap-2 px-4 py-3 text-white transition bg-green-500 rounded-full shadow-lg bottom-5 right-5 hover:bg-green-600"
        >
          <FaWhatsapp className="text-xl" />
          <span className="hidden text-sm font-medium sm:inline">
            সাহায্য দরকার?
          </span>
        </a>
      )}
    </div>
  );
};

export default BkashPaymentPage;
