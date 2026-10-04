"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiCopy, FiCheck } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import monthTranslation from "@/lib/monthTranslation";

const BKASH_NUMBER = process.env.NEXT_PUBLIC_BKASH_NUMBER;
const WHATSAPP_NUMBER = "8801776236285";

const DirectPaymentPage = () => {
  const { number } = useParams();
  const router = useRouter();
  const axiosPublic = useAxiosPublic();

  // step: "loading" -> "select" | "noDue" | "notFound" -> "confirm" -> "done"
  const [step, setStep] = useState("loading");

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

  // Auto-lookup by the phone number straight from the URL - no home/name
  // dropdowns needed when someone arrives via a direct link.
  useEffect(() => {
    const lookup = async () => {
      axiosPublic.post("/pay-link-visit", { number }).catch(() => {});
      try {
        const res = await axiosPublic.get(`/userByNumber/${number}`);
        if (res.data && res.data._id) {
          setUser(res.data);
          const unpaid = (res.data.PayMonths || []).filter(
            (m) => m.status === "unpaid",
          );
          const hasDue =
            unpaid.length > 0 ||
            res.data?.Tarabi?.status === "unpaid" ||
            Number(res.data?.Due) > 0;
          if (hasDue && Number(res.data?.Due) > 0) {
            setDueAmount(Number(res.data.Due));
          }
          setStep(hasDue ? "select" : "noDue");
        } else {
          setStep("notFound");
        }
      } catch {
        setStep("notFound");
      }
    };
    if (number) lookup();
  }, [number, axiosPublic]);

  useEffect(() => {
    if (user && Number(user.Due) > 0) {
      setDueAmount(Number(user.Due));
    }
  }, [user]);

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
  const allMonthsSelected =
    unpaidMonths.length > 0 && selectedMonths.length === unpaidMonths.length;

  const toggleAllMonths = () => {
    setSelectedMonths(
      allMonthsSelected ? [] : unpaidMonths.map((m) => m.monthName),
    );
  };

  const maskNumber = (num) => {
    if (!num || num.length < 6) return num || "";
    return `${num.slice(0, 3)}***${num.slice(-3)}`;
  };

  return (
    <div className="max-w-xl px-4 mx-auto my-10">
      <h1 className="mb-1 text-2xl font-bold text-center">
        Online চাঁদা পরিশোধ
      </h1>
      <p className="mb-8 text-sm text-center text-gray-500">
        ইসলামপুর জামে মসজিদ
      </p>

      {/* Looking up the member from the URL */}
      {step === "loading" && (
        <p className="text-sm text-center text-gray-400">তথ্য লোড হচ্ছে...</p>
      )}

      {/* Number in the URL didn't match any member */}
      {step === "notFound" && (
        <div className="py-10 space-y-4 text-center">
          <p className="text-4xl">❌</p>
          <p className="font-semibold">এই নাম্বারে কোনো সদস্য পাওয়া যায়নি।</p>
          <button
            onClick={() => router.push("/pay")}
            className="btn btn-outline btn-info"
          >
            বাড়ি/নাম থেকে বাছাই করুন
          </button>
        </div>
      )}

      {/* No dues at all */}
      {step === "noDue" && user && (
        <div className="py-10 space-y-4 text-center">
          <p className="text-4xl">🎉</p>
          <p className="font-semibold">{user.NameBn} এর কোনো বকেয়া নেই।</p>
        </div>
      )}

      {/* Step 2: choose what to pay - all types together */}
      {step === "select" && user && (
        <div className="space-y-4">
          <div className="p-3 text-sm border rounded-lg bg-gray-50">
            <p className="font-semibold">{user.NameBn}</p>
            <p className="text-gray-500">{user.HomeName}</p>
          </div>

          {!user.Number ? (
            <p className="text-[0.5rem] text-red-600 font-bold">
              আমাদের সার্ভারে আপনার নাম্বার নেই। মাসিক আপডেট পেতে দয়া করে আপনার
              নাম্বারটি আমাদের হোয়াটসঅ্যাপে প্রদান করবেন
            </p>
          ) : (
            <p className="text-[0.7rem] text-red-600 font-bold">
              পেমেন্ট রিসিভ হলে আপনার {maskNumber(user.Number)} নাম্বারে SMS
              পাঠানো হবে।
            </p>
          )}

          {unpaidMonths.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-semibold">
                মাসিক চাঁদা (৳{user.FeeRate}/মাস)
              </p>
              <button
                type="button"
                onClick={toggleAllMonths}
                className="mb-2 btn btn-xs btn-outline btn-info"
              >
                {allMonthsSelected ? "সব বাতিল করুন" : "সব মাস বাছাই করুন"}
              </button>
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
                  }}
                />
                বকেয়া পরিশোধ (মোট বকেয়া: ৳{user.Due})
              </label>
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

export default DirectPaymentPage;
