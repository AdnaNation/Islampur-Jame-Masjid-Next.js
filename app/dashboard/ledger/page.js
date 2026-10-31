"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useHomeName from "@/hooks/useHomeName";
import LedgerActions from "@/components/LedgerActions";
import { PageLoader, SectionLoader } from "@/components/Loader";

const MONTHS = [
  "জানু",
  "ফেব্রু",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টে",
  "অক্টো",
  "নভে",
  "ডিসে",
];

const COLS = [14, 6, 6, 4.5, ...Array(11).fill(7), 5.5, 7, 9];

const bn = (n) =>
  n
    ? Math.round(Number(n)).toLocaleString("bn-BD", {
        maximumFractionDigits: 0,
      })
    : "";
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

const PER_PAGE = 10;
const PAD_BLANK_ROWS = true;

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out.length ? out : [[]];
};

const HEAD_UNITS = 1.3;

const TOTAL_UNITS = HEAD_UNITS + PER_PAGE;
const rowH = (units = 1) => `${((units / TOTAL_UNITS) * 100).toFixed(4)}%`;

const nameSize = (name = "") => {
  const len = name.length;
  if (len > 26) return "text-[8px]";
  if (len > 20) return "text-[9px]";
  if (len > 14) return "text-[10px]";
  return "text-xs";
};

const th =
  "border border-slate-700 px-1 py-0 text-center font-semibold leading-tight overflow-hidden";
const td =
  "border border-slate-700 px-1 py-0 text-center text-xs font-semibold tabular-nums overflow-hidden";

function LedgerView() {
  const axiosPublic = useAxiosPublic();
  const params = useSearchParams();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(Number(params.get("year")) || thisYear);
  const [home, setHome] = useState(params.get("home") || "");
  const [homeNames] = useHomeName();

  const {
    data: homes = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["ledger", year, home],
    queryFn: async () => {
      const res = await axiosPublic.get("/ledger", {
        params: { year, ...(home ? { home } : {}) },
      });
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  const yearBn = Number(year).toLocaleString("bn-BD", { useGrouping: false });

  const pages = homes.flatMap((h) => {
    const parts = chunk(h.members, PER_PAGE);
    return parts.map((members, p) => ({
      home: h.home,
      all: h.members,
      members,
      page: p + 1,
      totalPages: parts.length,
      isLast: p === parts.length - 1,
    }));
  });

  const maskNumber = (num) => {
    if (!num || num.length < 6) return num || "";
    return `${num.slice(0, 3)}*****${num.slice(-3)}`;
  };

  return (
    <main id="ledger-root" className="p-4 bg-white">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          #ledger-root, #ledger-root * { visibility: visible !important; }
          html, body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mb-5 print:hidden">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 input input-bordered input-sm"
          />
          <select
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="">সব বাড়ি</option>
            {homeNames.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <LedgerActions fileName={`ledger-${year}`} />

        <p className="mt-2 text-xs text-center text-slate-500">
          প্রতিটি পৃষ্ঠা আলাদা ইমেজ হিসেবে ডাউনলোড হবে। PDF-এর জন্য প্রিন্ট চেপে
          "Save as PDF" ও "Landscape" বেছে নিন।
        </p>
      </div>

      {isPending && <SectionLoader label="বার্ষিক তালিকা তৈরি হচ্ছে..." />}
      {isError && (
        <p className="text-center text-red-600 print:hidden">
          ডেটা আনা যায়নি। এডমিন হিসেবে সাইন ইন করা আছে কিনা দেখুন।
        </p>
      )}
      {!isPending && !isError && homes.length === 0 && (
        <p className="text-center text-slate-500 print:hidden">
          কোনো তথ্য পাওয়া যায়নি।
        </p>
      )}

      <div className="overflow-x-auto print:overflow-visible">
        <div id="ledger-sheets" className="w-[1100px] bg-white print:w-auto">
          {pages.map((pg) => {
            const monthSums = MONTHS.map((_, i) =>
              sum(pg.all.map((x) => x.months[i])),
            );
            const tarabiSum = sum(pg.all.map((x) => x.tarabi));
            const dueRepaidSum = sum(pg.all.map((x) => x.dueRepaid));
            const grand = sum(monthSums) + tarabiSum + dueRepaidSum;
            const blanks = PAD_BLANK_ROWS
              ? Math.max(0, PER_PAGE - pg.members.length)
              : 0;

            return (
              <section
                key={`${pg.home}-${pg.page}`}
                data-ledger-page
                data-name={`${pg.home}-${pg.page}`}
                className="flex flex-col px-6 pt-5 pb-8 mb-6 overflow-hidden bg-white border text-slate-900 border-slate-300 break-after-page last:break-after-auto w-[1100px] h-[740px] print:w-[281mm] print:h-[186mm] print:mb-0 print:border-0 print:px-[4mm] print:pt-[3mm] print:pb-[8mm]"
              >
                <header className="relative mb-2 text-center shrink-0">
                  <h1 className="text-lg font-bold">ইসলামপুর জামে মসজিদ</h1>
                  <p className="text-xs">স্থাপিত - ১৯৪০ খ্রিঃ</p>
                  <h2 className="mt-1 text-sm font-bold underline">
                    বার্ষিক চাঁদার তালিকা {yearBn} ইং
                  </h2>
                  <p className="absolute bottom-0 right-0 text-sm">
                    সর্বমোট আদায়:{" "}
                    <span className="font-bold">৳ {bn(grand) || "০"}</span>
                  </p>
                  <p className="mt-1 text-sm">
                    বাড়ীর নাম: <span className="font-bold">{pg.home}</span>
                    {pg.totalPages > 1 && (
                      <span className="ml-2 text-xs text-slate-500">
                        (পৃষ্ঠা {bn(pg.page)}/{bn(pg.totalPages)})
                      </span>
                    )}
                  </p>
                </header>

                {/* table fills all remaining height of the A4 page */}
                <div className="relative flex-1 min-h-0">
                  <table className="absolute inset-0 w-full h-full text-[10px] border-collapse table-fixed">
                    <colgroup>
                      {COLS.map((w, i) => (
                        <col key={i} style={{ width: `${w}%` }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr style={{ height: rowH(HEAD_UNITS) }}>
                        <th className={th}>নাম ও মোবাইল নাম্বার</th>
                        <th className={th}>পূর্বের বকেয়া</th>
                        <th className={th}>বকেয়া আদায়</th>
                        <th className={th}>চাঁদার হার</th>
                        {MONTHS.map((mo) => (
                          <th key={mo} className={th}>
                            {mo}
                          </th>
                        ))}
                        <th className={th}>তারাবীর চাঁদা</th>
                        <th className={th}>মোট আদায়</th>
                        <th className={th}>মন্তব্য</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pg.members.map((x, i) => {
                        const total = sum(x.months) + x.tarabi + x.dueRepaid;
                        return (
                          <tr key={i} style={{ height: rowH() }}>
                            <td className={`${td} text-left`}>
                              <div className="flex flex-col justify-center overflow-hidden">
                                <div
                                  className={`font-semibold leading-tight ${nameSize(x.name)}`}
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {x.name}
                                </div>
                                <div className="text-[9px] leading-none text-slate-500">
                                  {maskNumber(x.mobile)}
                                </div>
                              </div>
                            </td>
                            <td className={td}>{bn(x.previousDue)}</td>
                            <td className={td}>{bn(x.dueRepaid)}</td>
                            <td className={td}>{bn(x.rate)}</td>
                            {x.months.map((v, idx) => (
                              <td key={idx} className={td}>
                                {bn(v)}
                              </td>
                            ))}
                            <td className={td}>{bn(x.tarabi)}</td>
                            <td className={`${td} font-bold`}>{bn(total)}</td>
                            <td className={`${td} text-left`}></td>
                          </tr>
                        );
                      })}

                      {/* empty rows so every page has PER_PAGE lines */}
                      {Array.from({ length: blanks }).map((_, i) => (
                        <tr key={`blank-${i}`} style={{ height: rowH() }}>
                          {COLS.map((_, c) => (
                            <td key={c} className={td}></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LedgerView />
    </Suspense>
  );
}
