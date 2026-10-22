"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import PaymentHistory from "@/components/PaymentHistory";
import { SectionLoader } from "@/components/Loader";
import {
  PayShell,
  Card,
  MemberCard,
  SmsNotice,
  DuesSelector,
  OrderSummary,
  MethodPicker,
  SendMoneyCard,
  ClaimForm,
  HelpLink,
  StatusCard,
  btnOutline,
} from "@/components/pay/PayUI";

const BKASH_NUMBER = process.env.NEXT_PUBLIC_BKASH_NUMBER;
const WHATSAPP_NUMBER = "8801776236285";
const METHODS = {
  bkash: { label: "bKash", rate: 0.015, color: "#E2136E", type: "mobile" },
  nagad: { label: "Nagad", rate: 0.013, color: "#F6921E", type: "mobile" },
  bank: { label: "Bank", rate: 0, color: "#0F766E", type: "bank" },
};

const BANK = {
  bankName: "Islami Bank Bangladesh PLC",
  branch: "Dudmukha Bazar Sub-Branch,Bashurhat",
  accountName: "AZIZUL ISLAM",
  accountNumber: "20506490200253503",
  routing: "125750251",
};

const DirectPaymentPage = () => {
  const { number } = useParams();
  const router = useRouter();
  const axiosPublic = useAxiosPublic();

  // step: "loading" -> "select" | "noDue" | "notFound" -> "confirm" -> "done"
  const [step, setStep] = useState("loading");
  const [method, setMethod] = useState("bkash");
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

  const CASHOUT_CHARGE_RATE = METHODS[method].rate;
  const charge = Math.round(totalAmount * CASHOUT_CHARGE_RATE);
  const totalToSend = totalAmount + charge;

  const canContinueToConfirm = totalAmount > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(BKASH_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleCopyAccount = () => {
    navigator.clipboard.writeText(BANK.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(String(totalToSend));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const getWhatsappLink = () => {
    const parts = [
      `আসসালামু আলাইকুম, আমার ${METHODS[method].label} পেমেন্টে সাহায্য দরকার।`,
    ];
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
        method,
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

  const stepNo = { select: 1, confirm: 2, done: 4 }[step] || 0;
  const isBank = METHODS[method].type === "bank";

  return (
    <PayShell stepNo={stepNo}>
      {/* Looking up the member from the URL */}
      {step === "loading" && (
        <Card>
          <SectionLoader label="তথ্য লোড হচ্ছে..." />
        </Card>
      )}

      {/* Number in the URL didn't match any member */}
      {step === "notFound" && (
        <>
          <StatusCard
            tone="error"
            title="এই নাম্বারে কোনো সদস্য পাওয়া যায়নি।"
            text="লিংকটি সঠিক আছে কিনা দেখুন, অথবা বাড়ি ও নাম বাছাই করে এগিয়ে যান।"
          />
          <button onClick={() => router.push("/pay")} className={btnOutline}>
            বাড়ি/নাম থেকে বাছাই করুন
          </button>
        </>
      )}

      {/* No dues at all */}
      {step === "noDue" && user && (
        <>
          <StatusCard
            title={`${user.NameBn} এর কোনো বকেয়া নেই।`}
            text="আলহামদুলিল্লাহ! আপনার সব চাঁদা পরিশোধিত।"
          />
          <Card>
            <PaymentHistory userId={user._id} />
          </Card>
        </>
      )}

      {/* Step 1: choose what to pay */}
      {step === "select" && user && (
        <>
          <MemberCard user={user} />
          <SmsNotice
            hasNumber={!!user.Number}
            masked={maskNumber(user.Number)}
          />
          <DuesSelector
            user={user}
            unpaidMonths={unpaidMonths}
            selectedMonths={selectedMonths}
            onToggleMonth={toggleMonth}
            allMonthsSelected={allMonthsSelected}
            onToggleAll={toggleAllMonths}
            payTarabi={payTarabi}
            onTarabi={setPayTarabi}
            payDueChecked={payDueChecked}
            onDue={setPayDueChecked}
            totalAmount={totalAmount}
            onNext={() => setStep("confirm")}
          />
          <Card>
            <PaymentHistory userId={user._id} />
          </Card>
        </>
      )}

      {/* Step 2: send money + submit trxID */}
      {step === "confirm" && (
        <>
          <OrderSummary
            months={selectedMonths}
            monthlyAmount={monthlyAmount}
            payTarabi={payTarabi}
            tarabiAmount={tarabiAmount}
            payDue={payDueChecked}
            dueAmount={dueAmountValue}
            totalAmount={totalAmount}
            rate={METHODS[method].rate}
          />
          <MethodPicker
            methods={METHODS}
            method={method}
            onChange={setMethod}
          />
          <SendMoneyCard
            method={method}
            methodInfo={METHODS[method]}
            totalAmount={totalAmount}
            charge={charge}
            totalToSend={totalToSend}
            copiedAmount={copiedAmount}
            onCopyAmount={handleCopyAmount}
            copied={copied}
            onCopyTarget={isBank ? handleCopyAccount : handleCopy}
            mobileNumber={BKASH_NUMBER}
            bank={BANK}
          />
          <ClaimForm
            isBank={isBank}
            methodLabel={METHODS[method].label}
            senderNumber={senderNumber}
            onSender={setSenderNumber}
            trxID={trxID}
            onTrx={setTrxID}
            onSubmit={handleSubmitClaim}
            submitting={submitting}
            onBack={() => setStep("select")}
          />
          {WHATSAPP_NUMBER && <HelpLink href={getWhatsappLink()} />}
        </>
      )}

      {/* Step 3: done */}
      {step === "done" && (
        <>
          <StatusCard
            title="ধন্যবাদ!"
            text="আপনার তথ্য জমা হয়েছে। অ্যাডমিন যাচাই করার পর আপনার চাঁদা আপডেট হবে।"
          />
          {WHATSAPP_NUMBER && <HelpLink href={getWhatsappLink()} />}
        </>
      )}
    </PayShell>
  );
};

export default DirectPaymentPage;
