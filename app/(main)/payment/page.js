"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FiLoader } from "react-icons/fi";
import {
  MdCalendarMonth,
  MdHistory,
  MdMoneyOff,
  MdNightsStay,
  MdPayments,
  MdSearchOff,
} from "react-icons/md";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useHomeName from "@/hooks/useHomeName";
import useAdmin from "@/hooks/useAdmin";

const fmt = (n) => (Number(n) || 0).toLocaleString("en-IN");

const TYPE_META = {
  Monthly: {
    Icon: MdCalendarMonth,
    bar: "from-emerald-500 to-emerald-300",
    chip: "bg-emerald-50 text-emerald-600",
    amount: "text-emerald-700",
  },
  Tarabi: {
    Icon: MdNightsStay,
    bar: "from-amber-500 to-amber-300",
    chip: "bg-amber-50 text-amber-600",
    amount: "text-amber-700",
  },
  Due: {
    Icon: MdMoneyOff,
    bar: "from-rose-500 to-rose-300",
    chip: "bg-rose-50 text-rose-600",
    amount: "text-rose-700",
  },
};
const FALLBACK_META = {
  Icon: MdPayments,
  bar: "from-gray-400 to-gray-300",
  chip: "bg-gray-100 text-gray-500",
  amount: "text-gray-700",
};

const METHOD_STYLE = {
  bkash: "bg-[#E2136E]",
  nagad: "bg-[#F6921E]",
  bank: "bg-teal-600",
};
const methodClass = (m) =>
  METHOD_STYLE[String(m).toLowerCase()] || "bg-gray-500";

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  return `${day}/${month}/${date.getFullYear()} ${hours % 12 || 12}:${minutes} ${ampm}`;
}

const PaymentHistory = () => {
  const [isAdmin] = useAdmin();
  const [homeName] = useHomeName();
  const [home, setHome] = useState("home");
  const [name, setName] = useState(" ");
  const [revertingId, setRevertingId] = useState(null);
  const [tab, setTab] = useState("active"); // "active" | "reverted"
  const axiosPublic = useAxiosPublic();

  // Non-admins should never end up stuck on the reverted tab.
  useEffect(() => {
    if (!isAdmin) setTab("active");
  }, [isAdmin]);

  const { data, refetch, isPending } = useQuery({
    queryKey: ["paymentHistory", home, name, tab],
    queryFn: async () =>
      await axiosPublic.get(
        `/paymentHistory?home=${home}&name=${name}&reverted=${
          tab === "reverted"
        }`,
      ),
  });

  const currentYear = new Date().getFullYear();
  const totalFeeCurrentYear = data?.data
    .filter((item) => Number(item.year) === currentYear)
    .reduce((sum, item) => sum + (Number(item.fee) || 0), 0);

  const { data: userName = {}, refetch: reload } = useQuery({
    queryKey: ["usersName", home],
    queryFn: async () => await axiosPublic.get(`/usersName/${home}`),
  });
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleHome = async (e) => {
    setName(" ");
    setHome(e.target.value);
    await reload();
  };
  const handleName = (e) => {
    const name = e.target.value;
    setName(name.split(" (")[0]);
    reload();
  };

  const typeLabel = (history) => {
    if (history.type === "Monthly")
      return `${history.monthName ? history.monthName + "'র " : ""}মাসিক চাঁদা`;
    if (history.type === "Tarabi") return "তারাবীর চাঁদা";
    if (history.type === "Due") return "বকেয়া চাঁদা";
    return "";
  };

  const canRevert = (history) => {
    const paidAt = new Date(history.time).getTime();
    if (Number.isNaN(paidAt)) return false;
    return Date.now() - paidAt <= 24 * 60 * 60 * 1000;
  };

  const handleRevert = async (history) => {
    const confirm = await Swal.fire({
      title: "নিশ্চিত করুন",
      html: `<b>${history.name}</b> (${history.home})<br/>${typeLabel(
        history,
      )} ৳${history.fee} - এই পেমেন্টটি বাতিল করা হবে।<br/><br/>এতে সংশ্লিষ্ট মাস/তারাবী/বকেয়া আবার "অপরিশোধিত" হয়ে যাবে এবং সদস্যকে একটি SMS পাঠানো হবে। এটি বাতিল করা যাবে না।`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, বাতিল করুন",
      cancelButtonText: "না",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    setRevertingId(history._id);
    try {
      await axiosPublic.patch(`/payment/${history._id}/revert`);
      Swal.fire({
        icon: "success",
        title: "বাতিল করা হয়েছে",
        timer: 1000,
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
      setRevertingId(null);
    }
  };

  const list = data?.data?.slice().reverse() || [];

  return (
    <div className="min-h-screen bg-[#f7f5ef]">
      {/* Banner */}
      <div className="bg-gradient-to-b from-[#0f3d2e] to-[#14523d] px-4 pt-8 pb-16 text-center text-white">
        <MdHistory className="mx-auto mb-1 text-3xl text-amber-300" />
        <h1 className="text-2xl font-bold">
          {tab === "reverted" ? "বাতিলকৃত পেমেন্ট" : "পেমেন্ট হিস্টোরি"}
        </h1>
        <p className="mt-1 text-sm text-white/70">
          ইসলামপুর জামে মসজিদের চাঁদা পরিশোধের তালিকা
        </p>

        {isAdmin && (
          <div className="inline-flex p-1 mt-4 rounded-full bg-white/10">
            {[
              ["active", "পেমেন্ট হিস্টোরি"],
              ["reverted", "বাতিলকৃত পেমেন্ট"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  tab === key
                    ? "bg-white text-[#0f3d2e] shadow"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-5xl px-4 pb-10 mx-auto -mt-10">
        {/* Filters */}
        <div className="p-4 bg-white shadow-md rounded-2xl">
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              onChange={handleHome}
              className="w-full select select-bordered"
            >
              <option value="home">সব বাড়ি</option>
              {homeName.map((home) => (
                <option value={home} key={home}>
                  {home}
                </option>
              ))}
            </select>

            <select
              disabled={home === "home"}
              onChange={handleName}
              className="w-full select select-bordered"
            >
              <option value="">
                {home === "home" ? "আগে বাড়ি বেছে নিন" : "সব সদস্য"}
              </option>
              {userName?.data?.map((name) => (
                <option value={name.NameBn} key={name._id}>
                  {name.NameBn}
                </option>
              ))}
            </select>
          </div>

          {data?.data && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="px-4 py-2 rounded-xl bg-stone-50">
                <p className="text-xs text-gray-500">মোট পেমেন্ট</p>
                <p className="text-lg font-bold text-gray-900">
                  {fmt(list.length)} টি
                </p>
              </div>
              {isAdmin && tab === "active" && (
                <div className="px-4 py-2 rounded-xl bg-emerald-50">
                  <p className="text-xs text-emerald-700">
                    {currentYear} সালের মোট
                  </p>
                  <p className="text-lg font-bold text-[#0f3d2e]">
                    ৳{fmt(Math.floor(totalFeeCurrentYear))}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* States */}
        {isPending && (
          <div className="flex justify-center mt-16 text-3xl text-gray-400 animate-spin">
            <FiLoader />
          </div>
        )}

        {data?.data?.length === 0 && (
          <div className="max-w-sm p-6 mx-auto mt-10 text-center bg-white border border-rose-100 shadow-sm rounded-2xl">
            <MdSearchOff className="mx-auto text-4xl text-rose-400" />
            <p className="mt-2 text-sm font-medium text-rose-700">
              {tab === "reverted"
                ? "কোনো বাতিলকৃত পেমেন্ট নেই!"
                : `${name.trim() ? name + "'র" : "এই বাড়ির"} কোনো পেমেন্ট হিস্টোরি নেই!`}
            </p>
          </div>
        )}

        {/* List */}
        <div className="grid gap-3 mt-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((history) => {
            const meta = TYPE_META[history.type] || FALLBACK_META;
            const reverted = tab === "reverted";

            const showRevert =
              tab === "active" && isAdmin && canRevert(history);

            return (
              <div
                key={history._id}
                className={`overflow-hidden bg-white shadow-sm rounded-2xl ${
                  reverted ? "opacity-70" : ""
                }`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${meta.bar}`} />

                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                    <span>{formatTime(history.time)}</span>
                    <span className="flex gap-1">
                      {reverted && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold text-white bg-gray-500 rounded-full">
                          বাতিলকৃত
                        </span>
                      )}
                      {history.method && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold text-white rounded-full ${methodClass(
                            history.method,
                          )}`}
                        >
                          {history.method}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mt-3">
                    <div
                      className={`flex items-center justify-center w-10 h-10 text-xl rounded-full shrink-0 ${meta.chip}`}
                    >
                      <meta.Icon />
                    </div>

                    <p
                      className={`text-[15px] leading-relaxed text-gray-600 ${
                        reverted ? "line-through" : ""
                      }`}
                    >
                      <b className="text-gray-900">{history.name}</b>{" "}
                      <small className="text-gray-400">({history.home})</small>{" "}
                      <small className="font-medium text-gray-700">
                        {history.monthName && history.monthName}
                      </small>{" "}
                      {history.type === "Monthly" && "মাসের মাসিক চাঁদা"}
                      {history.type === "Tarabi" && "তারাবীর"}{" "}
                      {history.type === "Due" && "বকেয়ার"}{" "}
                      <b className={`text-lg ${meta.amount}`}>
                        {history.fee} টাকা
                      </b>{" "}
                      পরিশোধ করেছেন।
                    </p>
                  </div>
                </div>

                {showRevert && (
                  <>
                    {/* perforated ticket divider */}
                    <div className="relative">
                      <div className="mx-4 border-t border-dashed" />
                      <span className="absolute w-4 h-4 rounded-full -left-2 -top-2 bg-[#f7f5ef]" />
                      <span className="absolute w-4 h-4 rounded-full -right-2 -top-2 bg-[#f7f5ef]" />
                    </div>
                    <div className="flex justify-end px-4 py-3">
                      <button
                        disabled={revertingId === history._id}
                        onClick={() => handleRevert(history)}
                        className="px-3 py-1 text-xs font-medium text-red-600 rounded-full bg-red-50 hover:bg-red-100 disabled:opacity-50"
                      >
                        {revertingId === history._id
                          ? "বাতিল হচ্ছে..."
                          : "বাতিল করুন"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
