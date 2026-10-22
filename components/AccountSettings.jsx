"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { MdEdit } from "react-icons/md";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import { fullDate } from "@/lib/accountReport";

const nf = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 });
const field =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0f3d2e] focus:outline-none";

// { startDate: "yyyy-mm-dd" | "", openingFund: number } saved in the database
export const useAccountSettings = () => {
  const axiosPublic = useAxiosPublic();
  return useQuery({
    queryKey: ["accountSettings"],
    queryFn: async () => (await axiosPublic.get("/account-settings")).data,
  });
};

export default function AccountSettings() {
  const axiosPublic = useAxiosPublic();
  const queryClient = useQueryClient();
  const { data: settings, isPending } = useAccountSettings();

  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [openingFund, setOpeningFund] = useState("");
  const [saving, setSaving] = useState(false);

  const isSet = Boolean(settings?.startDate);

  const startEdit = () => {
    setStartDate(settings?.startDate || "");
    setOpeningFund(isSet ? String(settings.openingFund) : "");
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosPublic.put("/account-settings", { startDate, openingFund });
      await Promise.all(
        ["accountSettings", "transactions", "accountReport"].map((k) =>
          queryClient.invalidateQueries({ queryKey: [k] }),
        ),
      );
      setOpen(false);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "সংরক্ষণ হয়েছে",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: err?.response?.data?.message || "কিছু একটা সমস্যা হয়েছে",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isPending) return null;

  return (
    <div className="min-w-0 p-3 bg-white border rounded-xl border-slate-200">
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 text-sm break-words text-slate-700">
            {isSet ? (
              <>
                হিসাব শুরু: <b>{fullDate(settings.startDate)}</b> • শুরুর ফান্ড:{" "}
                <b>৳{nf.format(settings.openingFund)}</b>
              </>
            ) : (
              "হিসাবের শুরুর তারিখ ও শুরুর ফান্ড এখনো সেট করা হয়নি"
            )}
          </p>
          <button
            onClick={startEdit}
            className="flex items-center gap-1 text-sm text-[#0f3d2e] underline"
          >
            <MdEdit /> {isSet ? "পরিবর্তন" : "সেট করুন"}
          </button>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block min-w-0">
              <span className="text-xs text-slate-500">হিসাব শুরুর তারিখ</span>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={field}
              />
            </label>
            <label className="block min-w-0">
              <span className="text-xs text-slate-500">
                শুরুর ফান্ড (শেষ ক্লোজিংয়ে অবশিষ্ট টাকা)
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                required
                value={openingFund}
                onChange={(e) => setOpeningFund(e.target.value)}
                placeholder="0"
                className={field}
              />
            </label>
          </div>
          <p className="text-xs text-slate-400">
            পেজগুলো এই তারিখ থেকে শুরু হবে এবং এই তারিখের শুরুতে ফান্ডে যত টাকা
            ছিল সেটাই “শুরুর ফান্ড”। এই তারিখের আগের এন্ট্রি পরের হিসাবে ধরা হয়
            না। যেকোনো সময় পরিবর্তন করা যাবে।
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[#0f3d2e] py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 text-sm rounded-lg bg-slate-200"
            >
              বাতিল
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
