"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  MdAccountBalanceWallet,
  MdAssistantDirection,
  MdCalendarMonth,
  MdMoneyOff,
  MdNightsStay,
  MdOutlineToggleOff,
  MdOutlineToggleOn,
  MdSms,
  MdWarningAmber,
  MdWhatsapp,
} from "react-icons/md";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useNumbers from "@/hooks/useNumbers";
import { BtnLoading } from "@/components/Loader";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

const StatCard = ({ title, value, Icon, border, chip }) => (
  <div
    className={`flex items-center gap-4 p-4 bg-white border-l-4 shadow-sm rounded-xl ${border}`}
  >
    <div
      className={`flex items-center justify-center w-12 h-12 text-2xl rounded-full shrink-0 ${chip}`}
    >
      <Icon />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">৳{fmt(value)}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const axiosPublic = useAxiosPublic();
  const allNumber = useNumbers();
  const monthName = new Date().toLocaleString("en-US", { month: "long" });
  const currentYear = new Date().getFullYear();
  const [paymentYear, setPaymentYear] = useState(currentYear);
  const { data: totalPayment, refetch: refresh } = useQuery({
    queryKey: ["total-payment", paymentYear],
    queryFn: async () =>
      await axiosPublic.get(`/total-payment?year=${paymentYear}`),
  });
  const { data: smsBalance, refetch: fresh } = useQuery({
    queryKey: ["check-balance"],
    queryFn: async () => await axiosPublic.get("/check-balance"),
  });
  const { data: lastClosingYear, refetch: lastYear } = useQuery({
    queryKey: ["last-closing-year"],
    queryFn: async () => await axiosPublic.get("/last-closing-year"),
  });

  const HandlePaymentYear = () => {
    setPaymentYear(paymentYear === currentYear ? currentYear - 1 : currentYear);
    refresh();
  };

  const {
    data: active,
    refetch,
    isPending,
  } = useQuery({
    queryKey: ["activeStatus"],
    queryFn: async () => await axiosPublic.get("/activeStatus"),
  });

  const handleTrue = async () => {
    await axiosPublic.patch("/activity").then((res) => {
      if (res.data.modifiedCount > 0) {
        refetch();
        Swal.fire({
          title: `তারাবী হিসাব ${
            !active?.data ? "সচল করা হয়েছে" : "বন্ধ করা হয়েছে"
          }`,
          showConfirmButton: false,
          timer: 600,
        });
      }
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      refresh();
      lastYear();
      fresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [refetch, refresh, lastYear, fresh]);

  const monthlyTotal =
    Math.floor(totalPayment?.data?.Monthly?.totalAmount) || 0;
  const tarabiTotal = Math.floor(totalPayment?.data?.Tarabi?.totalAmount) || 0;
  const dueTotal = Math.floor(totalPayment?.data?.Due?.totalAmount) || 0;

  const total = monthlyTotal + tarabiTotal + dueTotal;

  const smsHandle = () => {
    setLoading(true);
    const numbers = allNumber[0].map((n) => n.Number);
    for (const number of numbers) {
      if (number.length === 11) {
        axiosPublic.get(`/userByNumber/${number}`).then((res) => {
          const user = res.data;
          const currentMonthIndex = new Date().getMonth();
          const userFeeRate = Number(user.FeeRate);
          const TarabiFee =
            active?.data && user.Tarabi?.status === "unpaid"
              ? Number(user.Tarabi?.fee)
              : 0;
          const totalDue =
            user.PayMonths?.slice(0, currentMonthIndex + 1).filter(
              (m) => m.status === "unpaid",
            ).length *
              userFeeRate +
            Number(user.Due) +
            TarabiFee;
          const message = `${monthName}-${currentYear} পর্যন্ত আপনার বকেয়া চাঁদা ৳${totalDue}। পে করতে ভিজিট করুনঃ islampurjamemasjid.org/pay/${number} -ইসলামপুর জামে মসজিদ`;
          if (totalDue > 0) {
            axiosPublic
              .post("/sms-db", {
                number,
                lastSendingMonth: monthName,
                message,
              })
              .then((res) => {
                if (res?.data?.status !== "skipped") {
                  axiosPublic.post("/sms", { number, message });
                  fresh();
                  setLoading(false);
                }
              });
          } else {
            setLoading(false);
            fresh();
          }
        });
      }
    }
  };

  const handleWhatsapp = async () => {
    setLoading3(true);
    try {
      const numbers = allNumber[0].map((n) => n.Number);
      const currentMonthIndex = new Date().getMonth();

      for (const number of numbers) {
        const { data: user } = await axiosPublic.get(`/userByNumber/${number}`);

        const userFeeRate = Number(user?.FeeRate);
        const TarabiFee =
          active?.data && user.Tarabi?.status === "unpaid"
            ? Number(user.Tarabi?.fee)
            : 0;

        const unpaidMonths = user.PayMonths?.slice(
          0,
          currentMonthIndex + 1,
        ).filter((m) => m.status === "unpaid").length;

        const totalDue =
          unpaidMonths * userFeeRate + Number(user.Due) + TarabiFee;

        if (totalDue > 0) {
          const res = await axiosPublic.post("/sms-db/whatsapp", {
            number,
            lastSendingMonth: monthName,
          });

          if (res?.data?.status !== "skipped") {
            await axiosPublic.post("/whatsapp", {
              to: `${number}`,
              due_month: `${monthName}-${currentYear}`,
              due_amount: `${totalDue}`,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to send WhatsApp messages:", err);
    } finally {
      setLoading3(false);
    }
  };

  const ClosingYear = async () => {
    setLoading2(true);
    await axiosPublic.patch("/closing-year").then((res) => {
      if (res.data.modifiedCount > 0) {
        const numbers = allNumber[0].map((n) => n.Number);
        for (const number of numbers) {
          axiosPublic.get(`userByNumber/${number}`).then((userRes) => {
            axiosPublic
              .get(
                `/userPayment/${userRes?.data?._id}/${
                  lastClosingYear?.data?.lastSendingYear + 1
                }`,
              )
              .then((res) => {
                if (res?.data) {
                  const message = `${
                    lastClosingYear?.data?.lastSendingYear + 1
                  } সাল শেষে মাসিক চাঁদার হিসাবঃ

        পরিশোধিতঃ ${res?.data?.totalPaid}।
        বকেয়াঃ ${userRes?.data?.Due}।

        -ইসলামপুর জামে মসজিদ`;
                  axiosPublic.post("/sms", { number, message });
                }
              });
            axiosPublic.patch("/activity").then((res) => {
              if (res.data.modifiedCount > 0) {
                refetch();
              }
            });
          });
        }
      }
    });
    await axiosPublic.patch("/next-year").then((res) => {
      if (res.data.modifiedCount > 0) {
        setLoading2(false);
      }
    });
  };

  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const otherYear = paymentYear === currentYear ? currentYear - 1 : currentYear;
  const closingYear =
    lastClosingYear?.data?.lastSendingYear != null
      ? lastClosingYear.data.lastSendingYear + 1
      : null;
  const tarabiOn = Boolean(active?.data);

  const confirmClosingYear = async () => {
    const res = await Swal.fire({
      icon: "warning",
      title: `${closingYear}-এর হিসাব বন্ধ করবেন?`,
      text: "সবার কাছে বছর শেষের SMS যাবে এবং নতুন বছর শুরু হবে। এটি ফেরানো যাবে না।",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, বন্ধ করুন",
      cancelButtonText: "বাতিল",
      confirmButtonColor: "#dc2626",
    });
    if (res.isConfirmed) ClosingYear();
  };

  return (
    <div className="max-w-5xl min-h-screen p-3 mx-auto space-y-4 md:p-6 bg-orange-50">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">এডমিন ড্যাশবোর্ড</h1>
          <p className="text-sm text-gray-500">
            {paymentYear} সালের চাঁদার হিসাব
          </p>
        </div>
        <button
          onClick={HandlePaymentYear}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-sky-700 bg-white border border-sky-200 rounded-full shadow-sm hover:bg-sky-50"
        >
          {otherYear} সালের হিসাব দেখুন <MdAssistantDirection />
        </button>
      </div>

      {/* Total */}
      <div className="p-5 text-white shadow-lg rounded-2xl bg-[#0f3d2e]">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <MdAccountBalanceWallet className="text-lg" />
          সর্বমোট কালেকশান
        </div>
        <p className="mt-1 text-4xl font-bold md:text-5xl">৳{fmt(total)}</p>

        <div className="flex h-2.5 mt-5 overflow-hidden rounded-full bg-white/15">
          <div
            className="bg-emerald-400"
            style={{ width: `${(monthlyTotal / (total || 1)) * 100}%` }}
          />
          <div
            className="bg-rose-400"
            style={{ width: `${(dueTotal / (total || 1)) * 100}%` }}
          />
          <div
            className="bg-amber-400"
            style={{ width: `${(tarabiTotal / (total || 1)) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap mt-3 text-xs gap-x-4 gap-y-1 text-white/80">
          <span className="flex items-center gap-1">
            <i className="w-2 h-2 rounded-full bg-emerald-400" />
            মাসিক {pct(monthlyTotal)}%
          </span>
          <span className="flex items-center gap-1">
            <i className="w-2 h-2 rounded-full bg-rose-400" />
            বকেয়া {pct(dueTotal)}%
          </span>
          <span className="flex items-center gap-1">
            <i className="w-2 h-2 rounded-full bg-amber-400" />
            তারাবী {pct(tarabiTotal)}%
          </span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          title="মাসিক চাঁদা"
          value={monthlyTotal}
          Icon={MdCalendarMonth}
          border="border-emerald-500"
          chip="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="বকেয়া চাঁদা"
          value={dueTotal}
          Icon={MdMoneyOff}
          border="border-rose-500"
          chip="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="তারাবী চাঁদা"
          value={tarabiTotal}
          Icon={MdNightsStay}
          border="border-amber-500"
          chip="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Tarabi switch */}
        <div className="p-4 bg-white shadow-sm rounded-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-800">তারাবীর হিসাব</p>
              <p className="mt-0.5 text-xs text-gray-500">
                সচল থাকলে বকেয়ার SMS ও WhatsApp এ তারাবীর চাঁদা যুক্ত হবে।
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span
                className={`text-sm font-semibold ${
                  tarabiOn ? "text-gray-400" : "text-red-600"
                }`}
              >
                বন্ধ
              </span>
              <button
                disabled={isPending}
                onClick={handleTrue}
                aria-label="তারাবী হিসাব চালু/বন্ধ"
                className={`text-6xl leading-none ${
                  tarabiOn ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {tarabiOn ? <MdOutlineToggleOn /> : <MdOutlineToggleOff />}
              </button>
              <span
                className={`text-sm font-semibold ${
                  tarabiOn ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                সচল
              </span>
            </div>
          </div>
        </div>

        {/* Messaging */}
        <div className="p-4 bg-white shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-800">বকেয়ার মেসেজ পাঠান</p>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-50 text-sky-700">
              SMS ব্যালেন্স: {smsBalance?.data?.balance || 0}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={smsHandle}
              className="h-10 text-white border-0 btn btn-sm bg-sky-600 hover:bg-sky-700"
            >
              <MdSms className="text-lg" />
              {loading ? <BtnLoading text="পাঠানো হচ্ছে..." /> : "SMS পাঠান"}
            </button>
            <button
              onClick={handleWhatsapp}
              className="text-white border-0 btn btn-sm h-10 bg-[#25D366] hover:bg-[#1ebe5b]"
            >
              <MdWhatsapp className="text-lg" />
              {loading3 ? (
                <BtnLoading text="পাঠানো হচ্ছে..." />
              ) : (
                "WhatsApp পাঠান"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Closing year */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border border-rose-200 rounded-xl bg-rose-50">
        <div className="flex items-start gap-3">
          <MdWarningAmber className="mt-0.5 text-2xl text-rose-600 shrink-0" />
          <div>
            <p className="font-semibold text-rose-900">বছর শেষের হিসাব</p>
            <p className="text-xs text-rose-700">
              হিসাব বন্ধ করলে সবার কাছে বছরের হিসাব SMS যাবে এবং নতুন বছর শুরু
              হবে।
            </p>
          </div>
        </div>
        <button
          disabled={closingYear === null || closingYear === currentYear}
          onClick={confirmClosingYear}
          className="text-white border-0 btn btn-sm bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {loading2 ? (
            <BtnLoading text="বন্ধ হচ্ছে..." />
          ) : closingYear ? (
            `${closingYear}-এর হিসাব বন্ধ করুন`
          ) : (
            <BtnLoading text="লোড হচ্ছে..." />
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
