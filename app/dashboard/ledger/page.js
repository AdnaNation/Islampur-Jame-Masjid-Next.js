"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useHomeName from "@/hooks/useHomeName";
import { getLocalStorage } from "@/lib/localStorage";
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

// column widths (%), must add up to 100
const COLS = [16, 6, 6, 4.5, ...Array(12).fill(7), 5.5, 7, 9];

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

const th = "border border-slate-700 px-1 py-2 text-center font-semibold";
const td = "border border-slate-700 px-1 py-2 text-center tabular-nums";

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
        <div id="ledger-sheets" className="w-[1100px] bg-white print:w-full">
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
                className="p-3 mb-6 bg-white border min-h-[778px] text-slate-900 border-slate-300 break-after-page last:break-after-auto print:mb-0 print:min-h-0 print:border-0 print:p-0"
              >
                <header className="relative mb-3 text-center">
                  <h1 className="text-lg font-bold">ইসলামপুর জামে মসজিদ</h1>
                  <p className="text-xs">স্থাপিত - ১৯৪০ খ্রিঃ</p>
                  <h2 className="mt-1 text-sm font-bold underline">
                    বার্ষিক চাঁদার তালিকা {yearBn} ইং
                  </h2>
                  <p className="mt-1 text-sm">
                    বাড়ীর নাম: <span className="font-bold">{pg.home}</span>
                    {pg.totalPages > 1 && (
                      <span className="ml-2 text-xs text-slate-500">
                        (পৃষ্ঠা {bn(pg.page)}/{bn(pg.totalPages)})
                      </span>
                    )}
                  </p>
                </header>

                <table className="w-full text-[10px] border-collapse table-fixed">
                  <colgroup>
                    {COLS.map((w, i) => (
                      <col key={i} style={{ width: `${w}%` }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
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
                        <tr key={i} className="h-9">
                          <td className={`${td} text-left px-1`}>
                            <div className="font-semibold">{x.name}</div>
                            <div className="text-[9px] text-slate-500">
                              {x.mobile}
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
                          <td className={`${td} text-left px-1`}></td>
                        </tr>
                      );
                    })}

                    {/* empty rows so every page has 10 lines */}
                    {Array.from({ length: blanks }).map((_, i) => (
                      <tr key={`blank-${i}`} className="h-9">
                        {COLS.map((_, c) => (
                          <td key={c} className={td}></td>
                        ))}
                      </tr>
                    ))}

                    {pg.isLast && (
                      <tr className="font-bold bg-slate-100">
                        <td className={td}>সর্বমোট</td>
                        <td className={td}>
                          {bn(sum(pg.all.map((x) => x.previousDue)))}
                        </td>
                        <td className={td}>{bn(dueRepaidSum)}</td>
                        <td className={td}></td>
                        {monthSums.map((v, i) => (
                          <td key={i} className={td}>
                            {bn(v)}
                          </td>
                        ))}
                        <td className={td}>{bn(tarabiSum)}</td>
                        <td className={td}>{bn(grand)}</td>
                        <td className={td}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
