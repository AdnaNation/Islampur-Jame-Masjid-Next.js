"use client";

import { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import Swal from "sweetalert2";
import { FiLoader } from "react-icons/fi";
import {
  MdDelete,
  MdEdit,
  MdFilterAltOff,
  MdPictureAsPdf,
  MdSettings,
} from "react-icons/md";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import AccountSettings, {
  useAccountSettings,
} from "@/components/AccountSettings";

const PAGE_SIZE = 50;

const nf = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 });
const money = (n) => `৳${nf.format(n || 0)}`;
const signedMoney = (n) => `${n < 0 ? "−" : ""}${money(Math.abs(n))}`;
const dhakaYmd = (d) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }); // yyyy-mm-dd
const showDate = (d) =>
  new Date(d).toLocaleDateString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const errMsg = (e) => e?.response?.data?.message || "কিছু একটা সমস্যা হয়েছে";
const toast = (title) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title,
    showConfirmButton: false,
    timer: 1500,
  });

const field =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0f3d2e] focus:outline-none";
const blankForm = () => ({
  type: "income",
  categoryId: "",
  amount: "",
  date: dhakaYmd(new Date()),
  note: "",
});

const AccountsPage = () => {
  const axiosPublic = useAxiosPublic();
  const queryClient = useQueryClient();

  // ---------- categories ----------
  const { data: categories = [] } = useQuery({
    queryKey: ["accountCategories"],
    queryFn: async () => (await axiosPublic.get("/account-categories")).data,
  });
  const incomeCats = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories],
  );
  const expenseCats = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );

  // ---------- filters + history ----------
  const [fType, setFType] = useState("all");
  const [fCat, setFCat] = useState("");
  const { data: settings, isPending: settingsPending } = useAccountSettings();
  const [fFromRaw, setFFromRaw] = useState(null);
  const [fTo, setFTo] = useState("");
  const fFrom = fFromRaw ?? settings?.startDate ?? "";
  const [limit, setLimit] = useState(PAGE_SIZE);
  useEffect(() => setLimit(PAGE_SIZE), [fType, fCat, fFrom, fTo]);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["transactions", fType, fCat, fFrom, fTo, limit],
    queryFn: async () =>
      (
        await axiosPublic.get("/transactions", {
          params: {
            type: fType === "all" ? undefined : fType,
            categoryId: fCat || undefined,
            from: fFrom || undefined,
            to: fTo || undefined,
            limit,
          },
        })
      ).data,
    enabled: !settingsPending,
    placeholderData: keepPreviousData,
  });

  const items = data?.items || [];
  const income = data?.income || 0;
  const expense = data?.expense || 0;
  const hasFilter = fType !== "all" || fCat || fFromRaw !== null || fTo;
  const showFund = data?.opening != null && fType === "all" && !fCat;
  const opening = data?.opening ?? 0;
  const closing = opening + income - expense;

  const filterCats = useMemo(
    () =>
      fType === "all" ? categories : categories.filter((c) => c.type === fType),
    [categories, fType],
  );
  const incomeBreak = useMemo(
    () => (data?.byCategory || []).filter((c) => c.type === "income"),
    [data],
  );
  const expenseBreak = useMemo(
    () => (data?.byCategory || []).filter((c) => c.type === "expense"),
    [data],
  );

  const clearFilters = () => {
    setFType("all");
    setFCat("");
    setFFromRaw(null);
    setFTo("");
  };

  // ---------- add / edit form ----------
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newCat, setNewCat] = useState(null);
  const formCats = form.type === "income" ? incomeCats : expenseCats;

  const setType = (type) => {
    setForm((f) => ({ ...f, type, categoryId: "" }));
    setNewCat(null);
  };

  const addCategory = async () => {
    try {
      const res = await axiosPublic.post("/account-categories", {
        name: newCat,
        type: form.type,
      });
      await queryClient.invalidateQueries({ queryKey: ["accountCategories"] });
      setForm((f) => ({ ...f, categoryId: res.data._id }));
      setNewCat(null);
    } catch (e) {
      Swal.fire({ icon: "error", title: errMsg(e) });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.categoryId)
      return Swal.fire({ icon: "warning", title: "ক্যাটাগরি বেছে নিন" });
    setSaving(true);
    try {
      if (editingId)
        await axiosPublic.patch(`/transactions/${editingId}`, form);
      else await axiosPublic.post("/transactions", form);
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // after adding, keep type / category / date so the next entry is quick
      setForm((f) =>
        editingId ? blankForm() : { ...f, amount: "", note: "" },
      );
      setEditingId(null);
      toast("সংরক্ষণ হয়েছে");
    } catch (err) {
      Swal.fire({ icon: "error", title: errMsg(err) });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (it) => {
    setForm({
      type: it.type,
      categoryId: it.categoryId,
      amount: String(it.amount),
      date: dhakaYmd(it.date),
      note: it.note || "",
    });
    setNewCat(null);
    setEditingId(it._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setForm(blankForm());
  };

  const removeEntry = async (it) => {
    const r = await Swal.fire({
      title: "এন্ট্রি মুছবেন?",
      text: `${it.categoryName} • ${money(it.amount)}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "মুছুন",
      cancelButtonText: "বাতিল",
    });
    if (!r.isConfirmed) return;
    try {
      await axiosPublic.delete(`/transactions/${it._id}`);
      if (editingId === it._id) cancelEdit();
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (e) {
      Swal.fire({ icon: "error", title: errMsg(e) });
    }
  };

  // ---------- category manager ----------
  const [showManage, setShowManage] = useState(false);

  const renameCategory = async (c) => {
    const { value } = await Swal.fire({
      title: "ক্যাটাগরির নতুন নাম",
      input: "text",
      inputValue: c.name,
      showCancelButton: true,
      confirmButtonText: "সংরক্ষণ",
      cancelButtonText: "বাতিল",
      inputValidator: (v) => (!v.trim() ? "নাম লিখুন" : undefined),
    });
    if (!value) return;
    try {
      await axiosPublic.patch(`/account-categories/${c._id}`, { name: value });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accountCategories"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
    } catch (e) {
      Swal.fire({ icon: "error", title: errMsg(e) });
    }
  };

  const deleteCategory = async (c) => {
    const r = await Swal.fire({
      title: `"${c.name}" মুছবেন?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "মুছুন",
      cancelButtonText: "বাতিল",
    });
    if (!r.isConfirmed) return;
    try {
      await axiosPublic.delete(`/account-categories/${c._id}`);
      if (fCat === c._id) setFCat("");
      if (form.categoryId === c._id) setForm((f) => ({ ...f, categoryId: "" }));
      await queryClient.invalidateQueries({ queryKey: ["accountCategories"] });
    } catch (e) {
      Swal.fire({ icon: "error", title: errMsg(e) });
    }
  };

  const categoryColumn = ({ title, list, color }) => (
    <div key={title}>
      <p className={`mb-1 text-sm font-semibold ${color}`}>{title}</p>
      {list.length === 0 ? (
        <p className="text-xs text-slate-400">কোনো ক্যাটাগরি নেই</p>
      ) : (
        <ul className="space-y-1">
          {list.map((c) => (
            <li
              key={c._id}
              className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm rounded-lg bg-slate-50"
            >
              <span className="flex-1 min-w-0 break-words">{c.name}</span>
              <span className="flex gap-2 shrink-0 text-slate-500">
                <button
                  onClick={() => renameCategory(c)}
                  aria-label="নাম বদলান"
                >
                  <MdEdit />
                </button>
                <button
                  onClick={() => deleteCategory(c)}
                  className="text-rose-500"
                  aria-label="মুছুন"
                >
                  <MdDelete />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const isIncome = form.type === "income";

  return (
    <div className="w-full max-w-4xl min-w-0 p-3 mx-auto space-y-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-[#0f3d2e]">আয়-ব্যয়ের হিসাব</h1>
        <Link
          href={`/dashboard/accounts/report${
            fFrom || fTo
              ? `?${[fFrom && `from=${fFrom}`, fTo && `to=${fTo}`]
                  .filter(Boolean)
                  .join("&")}`
              : ""
          }`}
          className="flex items-center gap-1 rounded-lg bg-[#0f3d2e] px-3 py-2 text-sm font-semibold text-white"
        >
          <MdPictureAsPdf /> রিপোর্ট (PDF / ছবি)
        </Link>
      </div>

      <AccountSettings />

      {/* ---------- add / edit ---------- */}
      <form
        onSubmit={submit}
        className={`p-4 space-y-3 bg-white border rounded-xl shadow-sm ${
          editingId ? "border-amber-400" : "border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-800">
            {editingId ? "এন্ট্রি সম্পাদনা" : "নতুন এন্ট্রি"}
          </p>
          <button
            type="button"
            onClick={() => setShowManage((v) => !v)}
            className="flex items-center gap-1 text-sm text-[#0f3d2e] underline"
          >
            <MdSettings /> ক্যাটাগরি ম্যানেজ
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {["income", "expense"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                form.type === t
                  ? t === "income"
                    ? "bg-emerald-600 text-white"
                    : "bg-rose-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {t === "income" ? "আয়" : "ব্যয়"}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="text-xs text-slate-500">ক্যাটাগরি</span>
            <select
              value={form.categoryId}
              onChange={(e) =>
                e.target.value === "__new"
                  ? setNewCat("")
                  : setForm({ ...form, categoryId: e.target.value })
              }
              className={field}
            >
              <option value="">— বেছে নিন —</option>
              {formCats.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
              <option value="__new">＋ নতুন ক্যাটাগরি যোগ করুন</option>
            </select>
          </label>
          <label className="block min-w-0">
            <span className="text-xs text-slate-500">টাকার পরিমাণ</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
              className={field}
            />
          </label>
        </div>

        {newCat !== null && (
          <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-slate-50">
            <input
              autoFocus
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newCat.trim()) addCategory();
                }
              }}
              placeholder={`যেমন: ${isIncome ? "জুমার আয়" : "বিদ্যুৎ বিল"}`}
              className={`${field} basis-full sm:flex-1 sm:basis-0`}
            />
            <button
              type="button"
              disabled={!newCat.trim()}
              onClick={addCategory}
              className="flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg sm:flex-none bg-[#0f3d2e] disabled:opacity-40"
            >
              যোগ
            </button>
            <button
              type="button"
              onClick={() => setNewCat(null)}
              className="flex-1 px-3 py-2 text-sm rounded-lg sm:flex-none bg-slate-200"
            >
              বাতিল
            </button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="text-xs text-slate-500">তারিখ</span>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={field}
            />
          </label>
          <label className="block min-w-0">
            <span className="text-xs text-slate-500">নোট (ঐচ্ছিক)</span>
            <input
              value={form.note}
              maxLength={300}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="বিস্তারিত লিখুন"
              className={field}
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
              isIncome ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {saving
              ? "সংরক্ষণ হচ্ছে..."
              : editingId
                ? "আপডেট করুন"
                : isIncome
                  ? "আয় যোগ করুন"
                  : "ব্যয় যোগ করুন"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-5 text-sm rounded-lg bg-slate-200"
            >
              বাতিল
            </button>
          )}
        </div>
      </form>

      {/* ---------- category manager ---------- */}
      {showManage && (
        <div className="grid gap-4 p-4 bg-white border rounded-xl border-slate-200 sm:grid-cols-2">
          {categoryColumn({
            title: "আয়ের ক্যাটাগরি",
            list: incomeCats,
            color: "text-emerald-700",
          })}
          {categoryColumn({
            title: "ব্যয়ের ক্যাটাগরি",
            list: expenseCats,
            color: "text-rose-600",
          })}
          <p className="text-xs text-slate-400 sm:col-span-2">
            নতুন ক্যাটাগরি যোগ করতে উপরের ফর্মের ক্যাটাগরি তালিকা থেকে “নতুন
            ক্যাটাগরি যোগ করুন” বেছে নিন। যে ক্যাটাগরিতে এন্ট্রি আছে তা মুছা
            যাবে না।
          </p>
        </div>
      )}

      {/* ---------- filters ---------- */}
      <div className="p-4 space-y-3 bg-white border rounded-xl border-slate-200">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["all", "সব"],
            ["income", "আয়"],
            ["expense", "ব্যয়"],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => {
                setFType(v);
                setFCat("");
              }}
              className={`rounded-lg py-2 text-sm font-semibold ${
                fType === v
                  ? "bg-[#0f3d2e] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="block min-w-0">
            <span className="text-xs text-slate-500">ক্যাটাগরি</span>
            <select
              value={fCat}
              onChange={(e) => setFCat(e.target.value)}
              className={field}
            >
              <option value="">সব ক্যাটাগরি</option>
              {filterCats.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {fType === "all"
                    ? ` (${c.type === "income" ? "আয়" : "ব্যয়"})`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="text-xs text-slate-500">শুরুর তারিখ</span>
            <input
              type="date"
              value={fFrom}
              max={fTo || undefined}
              onChange={(e) => setFFromRaw(e.target.value)}
              className={field}
            />
          </label>
          <label className="block min-w-0">
            <span className="text-xs text-slate-500">শেষ তারিখ</span>
            <input
              type="date"
              value={fTo}
              min={fFrom || undefined}
              onChange={(e) => setFTo(e.target.value)}
              className={field}
            />
          </label>
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200"
            >
              <MdFilterAltOff /> মুছুন
            </button>
          )}
        </div>
      </div>

      {/* ---------- summary ---------- */}
      {(() => {
        const cards = showFund
          ? [
              [
                "শুরুর ফান্ড",
                signedMoney(opening),
                "bg-slate-100",
                "text-slate-600",
                "text-[#0f3d2e]",
              ],
              [
                "মোট আয়",
                money(income),
                "bg-emerald-50",
                "text-emerald-700",
                "text-emerald-800",
              ],
              [
                "মোট ব্যয়",
                money(expense),
                "bg-rose-50",
                "text-rose-700",
                "text-rose-800",
              ],
              [
                "অবশিষ্ট ফান্ড",
                signedMoney(closing),
                "bg-slate-100",
                "text-slate-600",
                closing < 0 ? "text-rose-700" : "text-[#0f3d2e]",
              ],
            ]
          : [
              [
                "মোট আয়",
                money(income),
                "bg-emerald-50",
                "text-emerald-700",
                "text-emerald-800",
              ],
              [
                "মোট ব্যয়",
                money(expense),
                "bg-rose-50",
                "text-rose-700",
                "text-rose-800",
              ],
              [
                "ব্যালেন্স",
                signedMoney(income - expense),
                "bg-slate-100",
                "text-slate-600",
                income - expense < 0 ? "text-rose-700" : "text-[#0f3d2e]",
              ],
            ];
        return (
          <div
            className={`grid grid-cols-2 gap-2 sm:gap-3 ${
              cards.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"
            }`}
          >
            {cards.map(([label, value, box, labelCls, valueCls], i) => (
              <div
                key={label}
                className={`min-w-0 rounded-xl p-3 ${box} ${
                  cards.length === 3 && i === 2
                    ? "col-span-2 sm:col-span-1"
                    : ""
                }`}
              >
                <p className={`text-xs ${labelCls}`}>{label}</p>
                <p
                  className={`break-words text-base font-bold sm:text-xl ${valueCls}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        );
      })()}

      {(incomeBreak.length > 0 || expenseBreak.length > 0) && (
        <div className="grid gap-4 p-4 bg-white border rounded-xl border-slate-200 sm:grid-cols-2">
          {[
            ["ক্যাটাগরি অনুযায়ী আয়", incomeBreak, "text-emerald-700"],
            ["ক্যাটাগরি অনুযায়ী ব্যয়", expenseBreak, "text-rose-600"],
          ].map(
            ([title, list, color]) =>
              list.length > 0 && (
                <div key={title} className="min-w-0">
                  <p className={`mb-1 text-sm font-semibold ${color}`}>
                    {title}
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {list.map((c) => (
                      <li
                        key={c.name}
                        className="flex items-start justify-between gap-3"
                      >
                        <span className="flex-1 min-w-0 break-words text-slate-600">
                          {c.name}{" "}
                          <span className="text-xs text-slate-400">
                            ({nf.format(c.count)})
                          </span>
                          {c.detail && (
                            <span className="block text-[11px] text-slate-400">
                              {c.detail}
                            </span>
                          )}
                        </span>
                        <span className="font-medium whitespace-nowrap shrink-0">
                          {money(c.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
      )}

      {/* ---------- history ---------- */}
      <div>
        <p className="mb-2 text-sm text-slate-500">
          মোট {nf.format(data?.count || 0)} টি এন্ট্রি
        </p>
        {isPending ? (
          <div className="flex justify-center mt-8 text-2xl text-gray-400 animate-spin">
            <FiLoader />
          </div>
        ) : isError ? (
          <p className="text-sm text-center text-rose-600">
            লোড হয়নি।{" "}
            <button onClick={() => refetch()} className="underline">
              আবার চেষ্টা করুন
            </button>
          </p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-center bg-white border rounded-xl border-slate-200 text-slate-500">
            {hasFilter
              ? "এই ফিল্টারে কোনো এন্ট্রি নেই।"
              : "এখনো কোনো এন্ট্রি যোগ করা হয়নি।"}
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it._id}
                className={`flex items-start gap-3 rounded-xl border bg-white p-3 ${
                  editingId === it._id ? "border-amber-400" : "border-slate-200"
                }`}
              >
                <span
                  className={`mt-0.5 h-10 w-1.5 shrink-0 rounded-full ${
                    it.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold break-words text-slate-900">
                    {it.categoryName}
                  </p>
                  {it.note && (
                    <p className="text-sm break-words text-slate-500">
                      {it.note}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">{showDate(it.date)}</p>
                </div>
                <div className="text-right shrink-0 whitespace-nowrap">
                  <p
                    className={`font-bold ${
                      it.type === "income"
                        ? "text-emerald-700"
                        : "text-rose-600"
                    }`}
                  >
                    {it.type === "income" ? "+" : "−"}
                    {money(it.amount)}
                  </p>
                  <div className="flex justify-end gap-3 mt-1 text-slate-500">
                    <button onClick={() => startEdit(it)} aria-label="সম্পাদনা">
                      <MdEdit />
                    </button>
                    <button
                      onClick={() => removeEntry(it)}
                      className="text-rose-500"
                      aria-label="মুছুন"
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {data && data.count > items.length && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="rounded-full border border-[#0f3d2e] px-6 py-2 text-sm font-semibold text-[#0f3d2e] transition hover:bg-[#0f3d2e] hover:text-white"
            >
              আরো দেখুন ({nf.format(data.count - items.length)})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsPage;
