"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MdOutlineToggleOff, MdOutlineToggleOn } from "react-icons/md";
import { MdAssistantDirection } from "react-icons/md";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useNumbers from "@/hooks/useNumbers";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
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
            !active?.data ? "সচল করা হয়েছে" : "বন্ধ করা হয়েছে"
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
          const message = `${monthName}-${currentYear} পর্যন্ত আপনার বকেয়া চাঁদা ৳${totalDue}। দয়া করে পরিশোধ করুন। -ইসলামপুর জামে মসজিদ`;
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
        বকেয়াঃ ${userRes?.data?.Due}।

        -ইসলামপুর জামে মসজিদ`;
                  axiosPublic.post("/sms", { number, message });
                }
              });
            axiosPublic.patch("/activity").then((res) => {
              console.log(res);
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
  //   const YearClosed = async () => {
  //     const numbers = allNumber[0].map((n) => n.Number);
  //     for (const number of numbers) {
  //       axiosPublic.get(`userByNumber/${number}`).then((userRes) => {
  //         axiosPublic
  //           .get(
  //             `/userPayment/${userRes?.data?._id}/${lastClosingYear?.data?.lastSendingYear}`
  //           )
  //           .then((res) => {
  //             if (res?.data?.totalPaid) {
  //               const message = `${lastClosingYear?.data?.lastSendingYear} সাল শেষে মাসিক চাঁদার হিসাবঃ

  // পরিশধিতঃ ${res?.data?.totalPaid}।
  // বকেয়াঃ ${userRes?.data?.Due}।

  // -ইসলামপুর জামে মসজিদ`;
  //               axiosPublic.post("/sms", { number, message }).then((res) => {
  //                 console.log(res);
  //               });
  //             }
  //           });
  //       });
  //     }
  //   };
  return (
    <div className="min-h-screen p-2 mx-auto border bg-orange-50">
      <button
        onClick={HandlePaymentYear}
        className="flex justify-center gap-1 mb-2 ml-6 text-blue-500 underline"
      >
        {paymentYear === currentYear ? currentYear - 1 : currentYear}{" "}
        <small className="flex items-center justify-center">
          সালের হিসাব দেখুন <MdAssistantDirection></MdAssistantDirection>{" "}
        </small>
      </button>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex flex-col items-center justify-center ">
          <p className="font-semibold">মাসিক চাঁদার হিসাব</p>
          <div className="p-4 mx-auto bg-white shadow-lg md:w-full w-72 rounded-2xl">
            <div className="flex items-center">
              <p className="ml-2 font-semibold text-gray-700 text-md">
                {" "}
                সর্বমোট চাঁদা কালেকশান{" "}
              </p>
            </div>

            <div className="mt-4 ">
              <p className="text-4xl font-bold text-left text-gray-900">
                {monthlyTotal} <small className="text-xl">টাকা</small>
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center ">
          <p className="font-semibold">বকেয়া চাঁদার হিসাব</p>
          <div className="p-4 mx-auto bg-white shadow-lg md:w-full w-72 rounded-2xl">
            <div className="flex items-center">
              <p className="ml-2 font-semibold text-gray-700 text-md">
                {" "}
                সর্বমোট বকেয়া কালেকশান{" "}
              </p>
            </div>

            <div className="mt-4 ">
              <p className="text-4xl font-bold text-left text-gray-900">
                {dueTotal} <small className="text-xl">টাকা</small>
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center ">
          <p className="font-semibold">তারাবী চাঁদার হিসাব</p>
          <div className="p-4 mx-auto bg-white shadow-lg md:w-full w-72 rounded-2xl">
            <div className="flex items-center">
              <p className="ml-2 font-semibold text-gray-700 text-md">
                {" "}
                সর্বমোট তারাবী কালেকশান{" "}
              </p>
            </div>

            <div className="mt-4 ">
              <p className="text-4xl font-bold text-left text-gray-900">
                {tarabiTotal} <small className="text-xl">টাকা</small>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="p-4 mx-auto bg-white shadow-lg w-72 rounded-2xl">
          <div className="flex items-center">
            <p className="ml-2 font-semibold text-gray-700 text-md">
              {" "}
              সর্বমোট কালেকশান{" "}
            </p>
          </div>

          <div className="flex flex-col justify-center mt-4">
            <p className="text-4xl font-bold text-left text-gray-900">
              {total} <small className="text-xl">টাকা</small>
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center mt-4">
        <p className="font-semibold">তারাবীর হিসাব</p>
        <div className="flex items-center gap-1">
          <p
            className={`text-red-700 ${
              !active?.data && "border-b-2 border-red-700"
            }`}
          >
            বন্ধ
          </p>
          <button
            disabled={isPending}
            className={`text-6xl ${
              active?.data ? "text-orange-500" : "text-red-700"
            }`}
            onClick={handleTrue}
          >
            {active?.data ? <MdOutlineToggleOn /> : <MdOutlineToggleOff />}
          </button>
          <p
            className={`text-orange-500 ${
              active?.data && "border-b-2 border-orange-500"
            }`}
          >
            সচল
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <button onClick={smsHandle} className="btn-primary btn">
          {loading ? "Sending SMS" : `Send SMS ${smsBalance?.data?.balance}`}
        </button>
      </div>
      <div className="flex items-center justify-center mt-2">
        <button
          disabled={lastClosingYear?.data?.lastSendingYear + 1 === currentYear}
          onClick={ClosingYear}
          className="btn-primary btn"
        >
          {loading2
            ? "বন্ধ হচ্ছে"
            : `${
                lastClosingYear?.data?.lastSendingYear + 1
              }-এর হিসাব বন্ধ করুন`}
        </button>
      </div>
      {/* <button onClick={YearClosed} className="btn">
        send year msg
      </button> */}
    </div>
  );
};

export default AdminDashboard;
