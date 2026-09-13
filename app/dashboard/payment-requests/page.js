"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";

const PaymentRequestsPage = () => {
  const axiosPublic = useAxiosPublic();
  const [tab, setTab] = useState("pending"); // pending | approved | rejected
  const [busyId, setBusyId] = useState(null);

  const {
    data: claims = [],
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["bkash-requests", tab],
    queryFn: async () => {
      const res = await axiosPublic.get(`/bkash-request?status=${tab}`);
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

    const confirm = await Swal.fire({
      title: "নিশ্চিত করুন",
      html: `<b>${claim.name}</b> (${claim.home})<br/>${breakdown}<br/>মোট প্রাপ্ত: ৳${claim.sentAmount}<br/>TrxID: <b>${claim.trxID}</b><br/><br/>আপনার bKash অ্যাপে এই TrxID এবং টাকার পরিমাণ মিলিয়ে দেখেছেন তো?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, অনুমোদন করুন",
      cancelButtonText: "বাতিল",
    });
    if (!confirm.isConfirmed) return;

    setBusyId(claim._id);
    try {
      await axiosPublic.patch(`/bkash-request/${claim._id}/approve`);
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
      text: `${claim.name} - ৳${claim.totalAmount} (TrxID: ${claim.trxID})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, প্রত্যাখ্যান করুন",
      cancelButtonText: "বাতিল",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    setBusyId(claim._id);
    try {
      await axiosPublic.patch(`/bkash-request/${claim._id}/reject`);
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

      {isPending && <p className="text-gray-400">লোড হচ্ছে...</p>}

      {!isPending && claims.length === 0 && (
        <p className="text-gray-400">কোনো অনুরোধ নেই।</p>
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
