"use client";

import { memo, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useAdmin from "@/hooks/useAdmin";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useHomeName from "@/hooks/useHomeName";
import { Sk } from "@/components/Loader";

// The big payment dialog is only downloaded when it is needed.
const loadModal = () => import("@/components/fee/FeeDetailsModal");
const FeeDetailsModal = dynamic(loadModal, { ssr: false });

const PAGE_SIZE = 20;
const monthIdx = new Date().getMonth();

const isUnpaid = (u, tarabiOn) =>
  u.PayMonths?.[monthIdx]?.status === "unpaid" ||
  Number(u.Due) > 0 ||
  (tarabiOn && u.Tarabi?.status === "unpaid");

const Row = memo(function Row({ user, unpaid, isAdmin, onOpen }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(user)}
        className={`flex w-full items-center gap-3 border-l-4 px-3 py-3 text-left transition hover:bg-[#eef3ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f3d2e] ${
          unpaid ? "border-rose-500" : "border-[#2f7d57]"
        }`}
      >
        <span className="flex-1 min-w-0">
          <span className="block truncate text-[15px] font-semibold text-[#0f3d2e]">
            {user.NameBn}
          </span>
          <span className="block text-xs truncate text-slate-500">
            {user.HomeName}
            {isAdmin && user.Number && (
              <span className="ml-2 tabular-nums">{user.Number}</span>
            )}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-base font-bold tabular-nums text-[#8a6420]">
            ৳{user.FeeRate}
          </span>
          <span
            className={`block text-[11px] font-medium ${
              unpaid ? "text-rose-600" : "text-[#2f7d57]"
            }`}
          >
            {unpaid ? "বকেয়া আছে" : "পরিশোধিত"}
          </span>
        </span>
      </button>
    </li>
  );
});

const Skeleton = () => (
  <ul className="overflow-hidden bg-white border divide-y divide-slate-200 rounded-xl border-slate-200">
    {Array.from({ length: 8 }).map((_, i) => (
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

const FeePage = () => {
  const [isAdmin] = useAdmin();
  const [homeName] = useHomeName();
  const axiosPublic = useAxiosPublic();

  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const [home, setHome] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(input.trim());
      setLimit(PAGE_SIZE);
    }, 300);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    loadModal();
  }, []);

  const isBn = /[\u0980-\u09FF]/.test(term);
  const search = isBn ? "" : term;
  const searchBn = isBn ? term : "";

  const {
    data: users = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["users", home, term],
    queryFn: async () =>
      (
        await axiosPublic.get(
          `/users?search=${encodeURIComponent(search)}&HomeName=${encodeURIComponent(
            home || " ",
          )}&searchBn=${encodeURIComponent(searchBn)}`,
        )
      ).data,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: active } = useQuery({
    queryKey: ["activeStatus"],
    queryFn: async () => (await axiosPublic.get("/activeStatus")).data,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
  const tarabiOn = !!active;

  const unpaidCount = useMemo(
    () => users.filter((u) => isUnpaid(u, tarabiOn)).length,
    [users, tarabiOn],
  );

  return (
    <main className="min-h-screen bg-[#f6f7f4] px-3 py-8 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0f3d2e]">চাঁদার তালিকা</h1>
        <p className="mt-1 text-sm text-slate-600">
          {users.length} জন সদস্য, {unpaidCount} জনের বকেয়া আছে
        </p>

        <div className="sticky top-4 z-0 -mx-3 mt-3 flex gap-2 bg-[#f6f7f4]/95 px-3 py-2 backdrop-blur sm:mx-0 sm:px-0">
          <select
            value={home}
            onChange={(e) => {
              setHome(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            aria-label="বাড়ির নাম"
            className="w-36 shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-2.5 text-sm focus:border-[#0f3d2e] focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20 sm:w-52"
          >
            <option value="">সব বাড়ি</option>
            {homeName.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="নাম দিয়ে খুঁজুন"
            aria-label="সদস্য খুঁজুন"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#0f3d2e] focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20"
          />
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
          ) : users.length === 0 ? (
            <p className="p-6 text-sm text-center bg-white border rounded-xl border-slate-200 text-slate-500">
              কোনো সদস্য পাওয়া যায়নি। অন্য নাম বা বাড়ি দিয়ে খুঁজুন।
            </p>
          ) : (
            <>
              <ul className="overflow-hidden bg-white border divide-y divide-slate-200 rounded-xl border-slate-200">
                {users.slice(0, limit).map((u) => (
                  <Row
                    key={u._id}
                    user={u}
                    unpaid={isUnpaid(u, tarabiOn)}
                    isAdmin={isAdmin}
                    onOpen={setSelected}
                  />
                ))}
              </ul>
              {users.length > limit && (
                <div className="mt-5 text-center">
                  <button
                    onClick={() => setLimit((l) => l + PAGE_SIZE)}
                    className="rounded-full border border-[#0f3d2e] px-6 py-2 text-sm font-semibold text-[#0f3d2e] transition hover:bg-[#0f3d2e] hover:text-white"
                  >
                    আরো দেখুন ({users.length - limit})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && (
        <FeeDetailsModal
          user={selected}
          isAdmin={isAdmin}
          tarabiOn={tarabiOn}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
};

export default FeePage;
