"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import { MdSearchOff } from "react-icons/md";
import { SectionLoader } from "@/components/Loader";

const METHOD_NAMES = { bkash: "bKash", nagad: "Nagad", bank: "ব্যাংক" };

const getMethodName = (claim) =>
  METHOD_NAMES[claim.method] || METHOD_NAMES.bkash;

const PaymentRequestsPage = () => {
  const axiosPublic = useAxiosPublic();
  const [tab, setTab] = useState("pending");
  const [busyId, setBusyId] = useState(null);

  const {
    data: claims = [],
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["pay-requests", tab],
    queryFn: async () => {
      const res = await axiosPublic.get(`/pay-request?status=${tab}`);
      return res.data;
    },
  });

  const handleApprove = async (claim) => {
    const breakdown = [
      claim.monthly && `মাসিক ৳${claim.monthly.amount}`,
      claim.tarabi && `তারাবী ৳${claim.tarabi.amount}`,
      claim.due && `বকেয়া ৳${claim.due.amount}`,
    ]
      .filter(Boolean)
      .join(", ");

    const methodLabel = getMethodName(claim);

    const confirm = await Swal.fire({
      title: "নিশ্চিত করুন",
      html: `<b>${claim.name}</b> (${claim.home})<br/>${breakdown}<br/>মোট প্রাপ্ত: ৳${claim.sentAmount}<br/>${methodLabel} TrxID: <b>${claim.trxID}</b><br/><br/>আপনার ${methodLabel} অ্যাকাউন্টে এই TrxID এবং টাকার পরিমাণ মিলিয়ে দেখেছেন তো?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, অনুমোদন করুন",
      cancelButtonText: "বাতিল",
    });
    if (!confirm.isConfirmed) return;

    setBusyId(claim._id);
    try {
      await axiosPublic
        .patch(`/pay-request/${claim._id}/approve`)
        .then((res) => {
          if (res?.data?.smsNumber && res?.data?.slipId) {
            axiosPublic.post("/whatsapp/payment", {
              to: res.data.smsNumber,
              total_amount: claim.totalAmount,
              slipId: res.data.slipId,
            });
          }
        });
      Swal.fire({
        icon: "success",
        title: "অনুমোদিত হয়েছে",
        timer: 1200,
        showConfirmButton: false,
      });
      refetch();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "ব্যর্থ হয়েছে",
        text: err?.response?.data?.error || "আবার চেষ্টা করুন",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (claim) => {
    const confirm = await Swal.fire({
      title: "প্রত্যাখ্যান করবেন?",
      text: `${claim.name} - ৳${claim.totalAmount} (${getMethodName(claim)} TrxID: ${claim.trxID})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, প্রত্যাখ্যান করুন",
      cancelButtonText: "বাতিল",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    setBusyId(claim._id);
    try {
      await axiosPublic.patch(`/pay-request/${claim._id}/reject`);
      refetch();
    } catch {
      Swal.fire({ icon: "error", title: "ব্যর্থ হয়েছে" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl min-h-screen p-4 mx-auto">
      <h1 className="mb-4 text-xl font-bold">পেমেন্ট রিকোয়েস্ট সমূহ</h1>

      <div className="mb-4 tabs tabs-boxed w-fit">
        {["pending", "approved", "rejected"].map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? "tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "pending"
              ? "অপেক্ষমান"
              : t === "approved"
                ? "অনুমোদিত"
                : "প্রত্যাখ্যাত"}
          </button>
        ))}
      </div>

      {isPending && (
        <SectionLoader
          label="রিকোয়েস্ট তালিকা লোড হচ্ছে..."
          className="mt-10"
        />
      )}

      {!isPending && claims.length === 0 && (
        <div className="max-w-sm p-6 mx-auto mt-10 text-center bg-white border shadow-sm border-rose-100 rounded-2xl">
          <MdSearchOff className="mx-auto text-4xl text-rose-400" />
          <p className="mt-2 text-sm font-medium text-rose-700">
            কোনো অনুরোধ নেই।
          </p>
        </div>
      )}

      <div className="space-y-3">
        {claims.map((claim) => (
          <div
            key={claim._id}
            className="flex flex-col gap-2 p-3 bg-white border rounded-lg shadow-sm md:flex-row md:items-center md:justify-between"
          >
            <div className="text-sm space-y-0.5">
              <p className="font-semibold">
                {claim.name}{" "}
                <span className="font-normal text-gray-500">
                  ({claim.home})
                </span>
              </p>
              {claim.monthly && (
                <p>
                  মাসিক চাঁদা ({claim.monthly.monthName}) - ৳
                  {claim.monthly.amount}
                </p>
              )}
              {claim.tarabi && <p>তারাবীর চাঁদা - ৳{claim.tarabi.amount}</p>}
              {claim.due && <p>বকেয়া - ৳{claim.due.amount}</p>}
              <p className="font-semibold">
                মোট: ৳{claim.totalAmount} (পাঠানো হয়েছে ৳{claim.sentAmount})
              </p>
              <p className="text-gray-500">
                <span className="px-2 py-0.5 mr-1 text-xs font-semibold text-white rounded-full bg-sky-600">
                  {getMethodName(claim)}
                </span>
                পাঠানো নাম্বার: {claim.senderNumber} · TrxID:{" "}
                <span className="font-mono">{claim.trxID}</span>
              </p>
              <p className="text-xs text-gray-400">
                জমা দেয়া হয়েছে:{" "}
                {new Date(claim.submittedAt).toLocaleString("bn-BD")}
              </p>
            </div>

            {claim.status === "pending" && (
              <div className="flex gap-2 shrink-0">
                <button
                  disabled={busyId === claim._id}
                  onClick={() => handleApprove(claim)}
                  className="text-white btn btn-sm btn-success"
                >
                  অনুমোদন
                </button>
                <button
                  disabled={busyId === claim._id}
                  onClick={() => handleReject(claim)}
                  className="text-white btn btn-sm btn-error"
                >
                  প্রত্যাখ্যান
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentRequestsPage;
