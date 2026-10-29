"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import NoticeSheets from "@/components/NoticeSheets";
import LedgerActions from "@/components/LedgerActions";
import { BtnLoading } from "@/components/Loader";
import { bn } from "@/lib/accountReport";
import { noticeDate } from "@/lib/noticeFormat";
import NoticeTableEditor from "@/components/NoticeTableEditor";
import NoticeAttachments from "@/components/NoticeAttachments";
import {
  markerFor,
  removeTableFromBody,
  withoutMarker,
} from "@/lib/noticeTable";

const DRAFT_KEY = "notice-draft";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0f3d2e] focus:outline-none";

const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

const emptyNotice = () => ({
  refNo: "",
  date: today(),
  title: "নোটিশ",
  subject: "",
  salutation: "",
  body: "",
  tables: [],
  attachments: [],
  showSign: true,
});

const errText = (e) =>
  e?.response?.data?.message || "কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন";

export default function NoticePage() {
  const axiosPublic = useAxiosPublic();
  const qc = useQueryClient();
  const [n, setN] = useState(emptyNotice);
  const [editingId, setEditingId] = useState(null); // set => "update", not "publish"
  const [pages, setPages] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef(null);

  const set = (key) => (e) =>
    setN((p) => ({
      ...p,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const { data: published = [], isPending: listPending } = useQuery({
    queryKey: ["notices", "admin"],
    queryFn: async () => (await axiosPublic.get("/notices?limit=100")).data,
  });

  // restore the last draft
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (saved?.notice) {
        setN((p) => ({ ...p, ...saved.notice }));
        setEditingId(saved.editingId || null);
      }
    } catch {}
    setLoaded(true);
  }, []);

  // save the draft as you type
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ notice: n, editingId }));
    } catch {}
  }, [n, editingId, loaded]);

  const reset = () => {
    setN(emptyNotice());
    setEditingId(null);
  };

  const clearAll = () => {
    if (confirm("সব লেখা মুছে নতুন নোটিশ শুরু করবেন?")) reset();
  };

  // put  [[table:N]]  into the text, where the cursor is
  const insertMarker = (i) => {
    const k = i + 1;
    const pos = bodyRef.current?.selectionStart;
    setN((p) => {
      const at = Math.min(pos ?? p.body.length, p.body.length);
      const before = withoutMarker(p.body.slice(0, at), k);
      const after = withoutMarker(p.body.slice(at), k);
      const pre = before && !before.endsWith("\n") ? "\n" : "";
      const post = after && !after.startsWith("\n") ? "\n" : "";
      return { ...p, body: before + pre + markerFor(k) + post + after };
    });
  };

  const removeTable = (i) => {
    if (!confirm(`টেবিল ${i + 1} মুছে ফেলবেন?`)) return;
    setN((p) => ({
      ...p,
      tables: p.tables.filter((_, k) => k !== i),
      body: removeTableFromBody(p.body, i + 1),
    }));
  };

  async function publish() {
    if (!n.body.trim() && !n.tables.length && !n.attachments.length) {
      Swal.fire({
        icon: "warning",
        text: "নোটিশের লেখা, টেবিল বা সংযুক্ত ফাইল দিন",
      });
      return;
    }
    setSaving(true);
    try {
      const res = editingId
        ? await axiosPublic.patch(`/notices/${editingId}`, n)
        : await axiosPublic.post("/notices", n);
      setEditingId(res.data._id);
      setN((p) => ({ ...p, attachments: res.data.attachments || [] }));
      qc.invalidateQueries({ queryKey: ["notices"] });
      Swal.fire({
        icon: "success",
        text: editingId ? "নোটিশ আপডেট হয়েছে" : "নোটিশ বোর্ডে প্রকাশ হয়েছে",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({ icon: "error", text: errText(e) });
    } finally {
      setSaving(false);
    }
  }

  async function edit(id) {
    try {
      const { data } = await axiosPublic.get(`/notices/${id}`);
      setN({
        refNo: data.refNo || "",
        date: data.date,
        title: data.title || "",
        subject: data.subject || "",
        salutation: data.salutation || "",
        body: data.body || "",
        tables: data.tables || [],
        attachments: data.attachments || [],
        showSign: data.showSign !== false,
      });
      setEditingId(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      Swal.fire({ icon: "error", text: errText(e) });
    }
  }

  async function remove(item) {
    const ok = await Swal.fire({
      icon: "warning",
      title: "নোটিশটি মুছবেন?",
      text: item.title + (item.subject ? ` — ${item.subject}` : ""),
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, মুছুন",
      cancelButtonText: "না",
      confirmButtonColor: "#e11d48",
    });
    if (!ok.isConfirmed) return;
    try {
      await axiosPublic.delete(`/notices/${item._id}`);
      if (editingId === item._id) setEditingId(null);
      qc.invalidateQueries({ queryKey: ["notices"] });
    } catch (e) {
      Swal.fire({ icon: "error", text: errText(e) });
    }
  }

  return (
    <main className="p-4 print:p-0 print:bg-white">
      <div className="max-w-3xl mx-auto mb-6 space-y-3 print:hidden">
        <h1 className="text-lg font-bold text-center text-[#0f3d2e]">
          নোটিশ জেনারেটর
        </h1>
        {editingId && (
          <p className="px-3 py-2 text-sm text-center rounded-lg bg-amber-100 text-amber-900">
            আপনি বোর্ডে প্রকাশিত একটি নোটিশ সম্পাদনা করছেন।
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="block mb-1 text-xs text-slate-500">
              সূত্র নং (ঐচ্ছিক)
            </span>
            <input
              value={n.refNo}
              maxLength={40}
              onChange={set("refNo")}
              placeholder="খালি রাখা যাবে"
              className={field}
            />
          </label>
          <label className="block">
            <span className="block mb-1 text-xs text-slate-500">তারিখ</span>
            <input
              type="date"
              value={n.date}
              onChange={set("date")}
              className={field}
            />
          </label>
          <label className="block">
            <span className="block mb-1 text-xs text-slate-500">শিরোনাম</span>
            <input
              value={n.title}
              maxLength={80}
              onChange={set("title")}
              placeholder="যেমন: নোটিশ / বিজ্ঞপ্তি"
              className={field}
            />
          </label>
          <label className="block">
            <span className="block mb-1 text-xs text-slate-500">
              বিষয় (ঐচ্ছিক)
            </span>
            <input
              value={n.subject}
              maxLength={150}
              onChange={set("subject")}
              placeholder="যেমন: জরুরি সভা প্রসঙ্গে"
              className={field}
            />
          </label>
        </div>

        <label className="block">
          <span className="block mb-1 text-xs text-slate-500">
            সম্বোধন (ঐচ্ছিক)
          </span>
          <input
            value={n.salutation}
            maxLength={120}
            onChange={set("salutation")}
            placeholder="যেমন: সম্মানিত মুসল্লিয়ানে কেরাম,"
            className={field}
          />
        </label>

        <label className="block">
          <span className="block mb-1 text-xs text-slate-500">
            নোটিশের লেখা
          </span>
          <textarea
            ref={bodyRef}
            value={n.body}
            onChange={set("body")}
            rows={12}
            placeholder="এখানে নোটিশ লিখুন… লম্বা হলে নিজে থেকেই পরের পৃষ্ঠায় চলে যাবে।"
            className={`${field} leading-relaxed`}
          />
        </label>

        <NoticeTableEditor
          tables={n.tables}
          onChange={(tables) => setN((p) => ({ ...p, tables }))}
          onInsert={insertMarker}
          onRemove={removeTable}
        />

        <NoticeAttachments
          attachments={n.attachments}
          onChange={(attachments) => setN((p) => ({ ...p, attachments }))}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={n.showSign}
              onChange={set("showSign")}
              className="w-4 h-4 accent-[#0f3d2e]"
            />
            শেষে সভাপতির স্বাক্ষর যুক্ত করুন
          </label>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">
              মোট পৃষ্ঠা: <b className="text-[#0f3d2e]">{bn(pages)}</b>
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="underline text-rose-600"
            >
              নতুন নোটিশ
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={publish}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60"
          >
            {saving ? (
              <BtnLoading text="অপেক্ষা করুন" />
            ) : editingId ? (
              "বোর্ডে আপডেট করুন"
            ) : (
              "নোটিশ বোর্ডে প্রকাশ করুন"
            )}
          </button>
        </div>

        <LedgerActions containerId="notice-sheet" fileName="notice" />
        <p className="text-xs text-center text-slate-500">
          PDF-এর জন্য “প্রিন্ট / PDF” চেপে “Save as PDF” ও “Portrait” বেছে নিন
          (Margins: None)। লেখা এই ব্রাউজারে স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে।
          “প্রকাশ করুন” চাপলে নোটিশ ওয়েবসাইটের হোমপেজ ও নোটিশ বোর্ডে সবাই দেখতে
          পাবে।
        </p>
      </div>

      <NoticeSheets notice={n} onPageCount={setPages} />

      {/* published notices */}
      <section className="max-w-3xl mx-auto mt-10 print:hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#0f3d2e]">প্রকাশিত নোটিশ</h2>
          <Link href="/notices" className="text-sm text-[#0f3d2e] underline">
            নোটিশ বোর্ড দেখুন →
          </Link>
        </div>
        {listPending ? (
          <p className="text-sm text-slate-500">লোড হচ্ছে…</p>
        ) : published.length === 0 ? (
          <p className="text-sm text-slate-500">
            এখনো কোনো নোটিশ প্রকাশ হয়নি।
          </p>
        ) : (
          <ul className="space-y-2">
            {published.map((p) => (
              <li
                key={p._id}
                className={`flex items-center gap-3 p-3 bg-white border rounded-xl ${
                  p._id === editingId
                    ? "border-amber-400 ring-1 ring-amber-300"
                    : "border-slate-200"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.title}</p>
                  <p className="text-xs truncate text-slate-500">
                    {noticeDate(p.date)}
                    {p.subject ? ` · ${p.subject}` : ""}
                  </p>
                </div>
                <Link
                  href={`/notices/${p._id}`}
                  className="text-sm underline text-slate-600"
                >
                  দেখুন
                </Link>
                <button
                  type="button"
                  onClick={() => edit(p._id)}
                  className="text-sm text-[#0f3d2e] underline"
                >
                  সম্পাদনা
                </button>
                <button
                  type="button"
                  onClick={() => remove(p)}
                  className="text-sm underline text-rose-600"
                >
                  মুছুন
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
