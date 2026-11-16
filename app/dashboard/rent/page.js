"use client";

import { memo, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { MdAdd } from "react-icons/md";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import usePendingQueue from "@/hooks/usePendingQueue";
import { applyPendingToShop } from "@/lib/offlineQueue";
import { BN_MONTHS, fmt, rentDue } from "@/lib/rent";
import { Sk } from "@/components/Loader";

// The big payment window is only downloaded when it is needed.
const loadModal = () => import("@/components/rent/RentDetailsModal");
const RentDetailsModal = dynamic(loadModal, { ssr: false });

const PAGE_SIZE = 20;

const Row = memo(function Row({ shop, due, onOpen }) {
  const unpaid = due > 0;
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(shop)}
        className={`flex w-full items-center gap-3 border-l-4 px-3 py-3 text-left transition hover:bg-[#eef3ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f3d2e] ${
          unpaid ? "border-rose-500" : "border-[#2f7d57]"
        }`}
      >
        <span className="flex-1 min-w-0">
          <span className="block truncate text-[15px] font-semibold text-[#0f3d2e]">
            {shop.NameBn}
          </span>
          <span className="block text-xs truncate text-slate-500">
            {shop.Name}
            {shop.Number && (
              <span className="ml-2 tabular-nums">{shop.Number}</span>
            )}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-base font-bold tabular-nums text-[#8a6420]">
            ৳{fmt(shop.Rent)}
          </span>
          <span
            className={`block text-[11px] font-medium ${
              unpaid ? "text-rose-600" : "text-[#2f7d57]"
            }`}
          >
            {unpaid ? `বকেয়া ৳${fmt(due)}` : "পরিশোধিত"}
          </span>
        </span>
      </button>
    </li>
  );
});

const Skeleton = () => (
  <ul className="overflow-hidden bg-white border divide-y divide-slate-200 rounded-xl border-slate-200">
    {Array.from({ length: 6 }).map((_, i) => (
      <li
        key={i}
        className="flex items-center gap-3 px-3 py-4 border-l-4 border-slate-200"
      >
        <div className="flex-1 space-y-2">
          <Sk className="h-3.5 w-1/2" />
          <Sk className="w-1/3 h-3" />
        </div>
        <Sk className="w-10 h-5" />
      </li>
    ))}
  </ul>
);

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#0f3d2e] focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20";

function AddShopSheet({ onClose, onAdded }) {
  const axiosPublic = useAxiosPublic();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const rent = String(f.get("Rent") || "").trim();
    if (!(Number(rent) > 0))
      return setError("ভাড়ার পরিমাণ ইংরেজি সংখ্যায় দিন");

    // months before the starting month are not owed, so they start as "paid"
    const start = Number(f.get("StartMonth")) || 0;
    const shop = {
      Name: String(f.get("NameEn") || "").trim(),
      NameBn: String(f.get("NameBn") || "").trim(),
      Number: String(f.get("Number") || "").trim(),
      Rent: rent,
      Due: 0,
      PayMonths: Object.keys(BN_MONTHS).map((monthName, i) => ({
        monthName,
        status: i < start ? "paid" : "unpaid",
      })),
    };
    setBusy(true);
    setError("");
    try {
      const res = await axiosPublic.post("/addShopKeeper", shop);
      onClose();
      if (res.data.queued) {
        Swal.fire({
          title: "সংরক্ষিত",
          text: `${shop.NameBn}-এর তথ্য অফলাইনে সংরক্ষিত — ইন্টারনেট এলে নিজে থেকেই অ্যাড হবে`,
          icon: "info",
          confirmButtonText: "Ok",
        });
      } else if (res.data.insertedId) {
        onAdded();
        Swal.fire({
          title: "Congrats!",
          text: `${shop.NameBn}কে অ্যাড করা হয়েছে!`,
          icon: "success",
          confirmButtonText: "Ok",
        });
      } else {
        Swal.fire({
          icon: "error",
          text: `${shop.NameBn} আগে থেকে অ্যাড আছেন`,
          showConfirmButton: false,
          timer: 1200,
        });
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "ব্যর্থ হয়েছে, আবার চেষ্টা করুন",
      );
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md p-5 space-y-3 overflow-y-auto bg-white shadow-2xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl"
      >
        <h3 className="text-lg font-bold text-[#0f3d2e]">
          নতুন দোকানদার অ্যাড করুন
        </h3>
        <label className="block text-xs font-medium text-slate-500">
          নাম বাংলায়
          <input name="NameBn" required className={inputCls} />
        </label>
        <label className="block text-xs font-medium text-slate-500">
          নাম ইংরেজীতে
          <input name="NameEn" required className={inputCls} />
        </label>
        <label className="block text-xs font-medium text-slate-500">
          মাসিক ভাড়া (ইংরেজি সংখ্যায়)
          <input
            name="Rent"
            required
            inputMode="decimal"
            className={inputCls}
          />
        </label>
        <label className="block text-xs font-medium text-slate-500">
          নাম্বার (01**)
          <input name="Number" inputMode="tel" className={inputCls} />
        </label>
        <label className="block text-xs font-medium text-slate-500">
          ভাড়া শুরুর মাস
          <select name="StartMonth" defaultValue="0" className={inputCls}>
            {Object.values(BN_MONTHS).map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
          <span className="block mt-1 text-[11px] text-slate-400">
            এর আগের মাসগুলো বকেয়া ধরা হবে না।
          </span>
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-lg bg-[#0f3d2e] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "…" : "অ্যাড করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}

const FILTERS = [
  ["all", "সব"],
  ["due", "বকেয়া আছে"],
  ["paid", "পরিশোধিত"],
];

const ShopRent = () => {
  const axiosPublic = useAxiosPublic();

  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(input.trim().toLowerCase());
      setLimit(PAGE_SIZE);
    }, 300);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    loadModal();
  }, []);

  const {
    data: raw = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["shopKeepers"],
    queryFn: async () => (await axiosPublic.get("/shopKeeper")).data,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // a payment that is still waiting to sync already counts as paid
  const pendingQ = usePendingQueue();
  const shops = useMemo(
    () =>
      (Array.isArray(raw) ? raw : []).map((s) =>
        applyPendingToShop(s, pendingQ),
      ),
    [raw, pendingQ],
  );

  // every shop with what it owes today (computed once per change)
  const rows = useMemo(
    () => shops.map((shop) => ({ shop, due: rentDue(shop).total })),
    [shops],
  );

  const totals = useMemo(
    () => ({
      count: rows.length,
      unpaid: rows.filter((r) => r.due > 0).length,
      rent: rows.reduce((sum, r) => sum + (Number(r.shop.Rent) || 0), 0),
      due: rows.reduce((sum, r) => sum + r.due, 0),
    }),
    [rows],
  );

  const visible = useMemo(
    () =>
      rows.filter(({ shop, due }) => {
        if (filter === "due" && !(due > 0)) return false;
        if (filter === "paid" && due > 0) return false;
        if (!term) return true;
        return [shop.NameBn, shop.Name, shop.Number].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(term),
        );
      }),
    [rows, filter, term],
  );

  // the window gets the saved record: it adds waiting changes by itself
  const selected = useMemo(
    () =>
      (Array.isArray(raw) ? raw : []).find((s) => s._id === selectedId) || null,
    [raw, selectedId],
  );

  return (
    <main className="min-h-screen px-3 py-6 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0f3d2e]">
              দোকান ভাড়ার তালিকা
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {totals.count} টি দোকান, {totals.unpaid} জনের বকেয়া আছে
            </p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 shrink-0 rounded-lg bg-[#0f3d2e] px-3 py-2 text-sm font-semibold text-white"
          >
            <MdAdd className="text-lg" /> নতুন দোকানদার
          </button>
        </div>

        {!isPending && !isError && totals.count > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="px-3 py-2 bg-white border rounded-xl border-slate-200">
              <span className="block text-[11px] text-slate-500">
                মাসিক মোট ভাড়া
              </span>
              <span className="text-lg font-bold tabular-nums text-[#8a6420]">
                ৳{fmt(totals.rent)}
              </span>
            </div>
            <div className="px-3 py-2 bg-white border rounded-xl border-slate-200">
              <span className="block text-[11px] text-slate-500">
                মোট বকেয়া (এখন পর্যন্ত)
              </span>
              <span className="text-lg font-bold tabular-nums text-rose-600">
                ৳{fmt(totals.due)}
              </span>
            </div>
          </div>
        )}

        <div className="sticky z-0 px-3 py-2 mt-3 -mx-3 space-y-2 top-28 bg-orange-50/95 backdrop-blur sm:mx-0 sm:px-0 md:top-16">
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="নাম বা নাম্বার দিয়ে খুঁজুন"
            aria-label="দোকানদার খুঁজুন"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#0f3d2e] focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20"
          />
          <div className="flex p-1 text-sm font-semibold bg-white border rounded-lg border-slate-200">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  setLimit(PAGE_SIZE);
                }}
                className={`flex-1 rounded-md py-1.5 ${
                  filter === key ? "bg-[#0f3d2e] text-white" : "text-slate-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2">
          {isPending ? (
            <Skeleton />
          ) : isError ? (
            <div className="p-6 text-sm text-center bg-white border rounded-xl border-rose-200">
              <p className="text-rose-600">
                তালিকা লোড হয়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 rounded-lg bg-[#0f3d2e] px-4 py-2 font-semibold text-white"
              >
                আবার লোড করুন
              </button>
            </div>
          ) : totals.count === 0 ? (
            <p className="p-6 text-sm text-center bg-white border rounded-xl border-slate-200 text-slate-500">
              এখনো কোনো দোকানদার অ্যাড করা হয়নি। উপরের “নতুন দোকানদার” বাটনে
              চাপ দিন।
            </p>
          ) : visible.length === 0 ? (
            <p className="p-6 text-sm text-center bg-white border rounded-xl border-slate-200 text-slate-500">
              কোনো দোকানদার পাওয়া যায়নি। অন্য নাম দিয়ে খুঁজুন।
            </p>
          ) : (
            <>
              <ul className="overflow-hidden bg-white border divide-y divide-slate-200 rounded-xl border-slate-200">
                {visible.slice(0, limit).map(({ shop, due }) => (
                  <Row
                    key={shop._id}
                    shop={shop}
                    due={due}
                    onOpen={(s) => setSelectedId(s._id)}
                  />
                ))}
              </ul>
              {visible.length > limit && (
                <div className="mt-5 text-center">
                  <button
                    onClick={() => setLimit((l) => l + PAGE_SIZE)}
                    className="rounded-full border border-[#0f3d2e] px-6 py-2 text-sm font-semibold text-[#0f3d2e] transition hover:bg-[#0f3d2e] hover:text-white"
                  >
                    আরো দেখুন ({visible.length - limit})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && (
        <RentDetailsModal shop={selected} onClose={() => setSelectedId(null)} />
      )}
      {adding && (
        <AddShopSheet
          onClose={() => setAdding(false)}
          onAdded={() => refetch()}
        />
      )}
    </main>
  );
};

export default ShopRent;
