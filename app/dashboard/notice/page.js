"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Letterhead, { LETTERHEAD } from "@/components/Letterhead";
import LedgerActions from "@/components/LedgerActions";
import { bn } from "@/lib/accountReport";

// ---- edit here -------------------------------------------------------------
const SIGN_SRC = "/president.jpg";
const SIGNER_TITLE = "সভাপতি";
const DRAFT_KEY = "notice-draft";
// -----------------------------------------------------------------------------

// A4 at 96dpi (1122px < 297mm, so the browser never adds a blank page)
const PAGE_W = 793;
const PAGE_H = 1122;
const PAD_T = 40;
const PAD_B = 40;
const PAD_L = 56;
const PAD_R = 57;
const BODY_W = PAGE_W - PAD_L - PAD_R; // 680 – one text column = one page

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
  showSign: true,
});

function SignBlock() {
  return (
    <div
      className="mt-10 text-right"
      style={{ breakInside: "avoid", breakBefore: "avoid" }}
    >
      <div className="inline-block min-w-[200px] text-center">
        <div className="flex items-end justify-center h-[72px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SIGN_SRC}
            alt=""
            width={92}
            height={92}
            className="object-contain "
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
        </div>
        <div className="pt-1 border-t border-black">
          <p className="text-[15px] font-bold leading-snug">লোকমান হোসেন</p>
          <p className="text-[15px] font-bold leading-snug">{SIGNER_TITLE}</p>
          <p className="text-[13px] font-semibold leading-snug">
            {LETTERHEAD.name}
          </p>
        </div>
      </div>
    </div>
  );
}

// Everything that flows across pages: title, subject, salutation, body, sign.
function NoticeContent({ n }) {
  return (
    <div style={{ fontSize: 16, lineHeight: 1.9, color: "#000" }}>
      {n.title && (
        <h2
          className="mb-3 text-center text-[22px] font-bold leading-tight"
          style={{ breakAfter: "avoid" }}
        >
          <span className="pb-0.5 border-b-2 border-black">{n.title}</span>
        </h2>
      )}
      {n.subject && (
        <p
          className="mb-4 font-bold leading-snug text-center"
          style={{ breakAfter: "avoid" }}
        >
          বিষয়ঃ {n.subject}
        </p>
      )}
      {n.salutation && (
        <p className="mb-1 font-semibold" style={{ breakAfter: "avoid" }}>
          {n.salutation}
        </p>
      )}
      <div
        style={{
          whiteSpace: "pre-wrap",
          textAlign: "justify",
          overflowWrap: "anywhere",
        }}
      >
        {n.body}
      </div>
      {n.showSign && <SignBlock />}
    </div>
  );
}

/**
 * One A4 sheet. The text lives in a multi-column box whose columns are exactly
 * one page wide; page `index` just slides that box left to show column `index`.
 * With `measure` the box is left unshifted so we can read how many columns
 * (= pages) the text needs.
 */
function Sheet({ n, index = 0, total = 1, measure = false, boxRef }) {
  return (
    <section
      data-ledger-page={measure ? undefined : ""}
      data-name={`page-${index + 1}`}
      className="relative flex flex-col overflow-hidden text-black bg-white"
      style={{
        width: PAGE_W,
        height: PAGE_H,
        padding: `${PAD_T}px ${PAD_R}px ${PAD_B}px ${PAD_L}px`,
      }}
    >
      <Letterhead refNo={n.refNo} dateYmd={n.date} />

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div
          ref={boxRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: BODY_W,
            height: "100%",
            columnWidth: BODY_W,
            columnGap: 0,
            columnFill: "auto",
            overflow: measure ? "hidden" : "visible",
            transform: measure ? undefined : `translateX(${-index * BODY_W}px)`,
          }}
        >
          <NoticeContent n={n} />
        </div>
      </div>

      {!measure && total > 1 && (
        <p
          className="absolute left-0 right-0 text-[11px] text-center text-slate-500"
          style={{ bottom: 14 }}
        >
          পৃষ্ঠা {bn(index + 1)} / {bn(total)}
        </p>
      )}
    </section>
  );
}

export default function NoticePage() {
  const [n, setN] = useState(emptyNotice);
  const [pages, setPages] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const boxRef = useRef(null);

  const set = (key) => (e) =>
    setN((p) => ({
      ...p,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  // restore the last draft
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (saved) setN((p) => ({ ...p, ...saved }));
    } catch {}
    setLoaded(true);
  }, []);

  // save the draft as you type
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(n));
    } catch {}
  }, [n, loaded]);

  // count pages: how many page-wide columns did the text need?
  const measure = () => {
    const el = boxRef.current;
    if (!el) return;
    setPages(Math.max(1, Math.ceil((el.scrollWidth - 2) / BODY_W)));
  };
  useLayoutEffect(measure, [n]);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    // re-measure when fonts / the logo finish loading and change heights
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  const clearAll = () => {
    if (confirm("সব লেখা মুছে নতুন নোটিশ শুরু করবেন?")) setN(emptyNotice());
  };

  return (
    <main className="p-4 print:p-0 print:bg-white">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto mb-6 space-y-3 print:hidden">
        <h1 className="text-lg font-bold text-center text-[#0f3d2e]">
          নোটিশ জেনারেটর
        </h1>

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
            value={n.body}
            onChange={set("body")}
            rows={12}
            placeholder="এখানে নোটিশ লিখুন… লম্বা হলে নিজে থেকেই পরের পৃষ্ঠায় চলে যাবে।"
            className={`${field} leading-relaxed`}
          />
        </label>

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

        <LedgerActions containerId="notice-sheet" fileName="notice" />
        <p className="text-xs text-center text-slate-500">
          PDF-এর জন্য “প্রিন্ট / PDF” চেপে “Save as PDF” ও “Portrait” বেছে নিন
          (Margins: None)। লেখা এই ব্রাউজারে স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে।
        </p>
      </div>

      {/* the pages */}
      <div id="notice-sheet" className="overflow-x-auto print:overflow-visible">
        <div
          className="mx-auto space-y-6 print:space-y-0"
          style={{ width: PAGE_W }}
        >
          {Array.from({ length: pages }, (_, i) => (
            <div
              key={i}
              className="shadow-md print:shadow-none print:break-after-page print:last:break-after-auto"
              style={{ width: PAGE_W, height: PAGE_H }}
            >
              <Sheet n={n} index={i} total={pages} />
            </div>
          ))}
        </div>
      </div>

      {/* hidden copy used only to count pages */}
      <div
        aria-hidden="true"
        className="absolute top-0 invisible pointer-events-none print:hidden"
        style={{ left: -20000 }}
      >
        <Sheet n={n} measure boxRef={boxRef} />
      </div>
    </main>
  );
}
