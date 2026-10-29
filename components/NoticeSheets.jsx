"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Letterhead, { LETTERHEAD } from "@/components/Letterhead";
import { bn } from "@/lib/accountReport";
import NoticeTable from "@/components/NoticeTable";
import { splitBody } from "@/lib/noticeTable";

// ---- edit here -------------------------------------------------------------
const SIGN_SRC = "/president.jpg";
const SIGNER_NAME = "লোকমান হোসেন";
const SIGNER_TITLE = "সভাপতি";
// -----------------------------------------------------------------------------

// A4 at 96dpi (1122px < 297mm, so the browser never adds a blank page)
export const PAGE_W = 793;
export const PAGE_H = 1122;
const PAD_T = 40;
const PAD_B = 40;
const PAD_L = 56;
const PAD_R = 57;
const BODY_W = PAGE_W - PAD_L - PAD_R; // 680 – one text column = one page

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
            className="object-contain max-h-[72px] max-w-[200px]"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
        </div>
        <div className="pt-1 border-t border-black">
          <p className="text-[15px] font-bold leading-snug">{SIGNER_NAME}</p>
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
      {splitBody(n.body, n.tables?.length || 0).map((p, i) =>
        p.type === "table" ? (
          <NoticeTable key={i} t={n.tables[p.index]} />
        ) : (
          <div
            key={i}
            style={{
              whiteSpace: "pre-wrap",
              textAlign: "justify",
              overflowWrap: "anywhere",
            }}
          >
            {p.text}
          </div>
        ),
      )}
      {n.showSign && <SignBlock />}
    </div>
  );
}

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

export default function NoticeSheets({
  notice: n,
  id = "notice-sheet",
  onPageCount,
}) {
  const [pages, setPages] = useState(1);
  const [scale, setScale] = useState(1);
  const boxRef = useRef(null);
  const outerRef = useRef(null);

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
  useEffect(() => {
    onPageCount?.(pages);
  }, [pages, onPageCount]);

  // shrink the pages to fit narrow screens (phones); print is never scaled
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / PAGE_W) || 1);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div id={id} ref={outerRef} className="relative w-full">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .notice-stack { width: auto !important; }
          .notice-slot { width: auto !important; height: auto !important; box-shadow: none !important; break-after: page; }
          .notice-slot:last-child { break-after: auto; }
          .notice-scale { transform: none !important; }
          .notice-measure { display: none !important; }
        }
      `}</style>

      <div className="mx-auto notice-stack" style={{ width: PAGE_W * scale }}>
        {Array.from({ length: pages }, (_, i) => (
          <div
            key={i}
            className="mb-6 shadow-md notice-slot last:mb-0 print:mb-0"
            style={{ width: PAGE_W * scale, height: PAGE_H * scale }}
          >
            <div
              className="notice-scale"
              style={{
                width: PAGE_W,
                height: PAGE_H,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <Sheet n={n} index={i} total={pages} />
            </div>
          </div>
        ))}
      </div>

      {/* hidden copy used only to count pages */}
      <div
        aria-hidden="true"
        className="absolute top-0 invisible pointer-events-none notice-measure"
        style={{ left: -20000 }}
      >
        <Sheet n={n} measure boxRef={boxRef} />
      </div>
    </div>
  );
}
