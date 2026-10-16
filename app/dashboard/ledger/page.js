"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useHomeName from "@/hooks/useHomeName";
import { getLocalStorage } from "@/lib/localStorage";
import SlipActions from "@/components/SlipActions";

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
const COLS = [16, 5, 5, 4.5, ...Array(12).fill(4), 5.5, 6, 10];

const bn = (n) =>
  n ? Number(n).toLocaleString("bn-BD", { maximumFractionDigits: 2 }) : "";
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

const th = "border border-slate-700 px-0.5 py-1 text-center font-semibold";
const td = "border border-slate-700 px-0.5 py-1 text-center tabular-nums";

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
      const token = getLocalStorage("access-token");
      const res = await axiosPublic.get("/ledger", {
        params: { year, ...(home ? { home } : {}) },
        headers: { authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  const yearBn = Number(year).toLocaleString("bn-BD", { useGrouping: false });

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

      {/* toolbar: never printed, never in the image */}
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

        <SlipActions targetId="ledger-sheets" fileName={`ledger-${year}`} />

        <p className="mt-2 text-xs text-center text-slate-500">
          PDF: প্রিন্ট চাপুন, Destination "Save as PDF" ও Layout "Landscape"
          বেছে নিন। ইমেজের জন্য আগে একটি বাড়ি বেছে নিন।
        </p>
      </div>

      {isPending && <p className="text-center print:hidden">লোড হচ্ছে...</p>}
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

      {/* scrolls sideways on screen; full width when printing */}
      <div className="overflow-x-auto print:overflow-visible">
        {/* this is what the image download captures */}
        <div id="ledger-sheets" className="w-[1100px] bg-white print:w-full">
          {homes.map((h) => {
            const m = h.members;
            const monthSums = MONTHS.map((_, i) =>
              sum(m.map((x) => x.months[i])),
            );
            const tarabiSum = sum(m.map((x) => x.tarabi));
            const dueRepaidSum = sum(m.map((x) => x.dueRepaid));
            const grand = sum(monthSums) + tarabiSum + dueRepaidSum;

            return (
              <section
                key={h.home}
                className="p-3 mb-6 border text-slate-900 border-slate-300 break-after-page last:break-after-auto print:mb-0 print:border-0 print:p-0"
              >
                <header className="relative mb-3 text-center">
                  <Image
                    src="/logo.jpg"
                    alt=""
                    width={44}
                    height={44}
                    className="absolute top-0 left-0 rounded-full"
                  />
                  <h1 className="text-lg font-bold">ইসলামপুর জামে মসজিদ</h1>
                  <p className="text-xs">স্থাপিত - ১৯৬৩ খ্রিঃ</p>
                  <h2 className="mt-1 text-sm font-bold underline">
                    বার্ষিক চাঁদার তালিকা {yearBn} ইং
                  </h2>
                  <p className="mt-1 text-sm">
                    বাড়ীর নাম: <span className="font-bold">{h.home}</span>
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
                    {m.map((x, i) => {
                      const total = sum(x.months) + x.tarabi + x.dueRepaid;
                      return (
                        <tr key={i} className="h-9 break-inside-avoid">
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
                          <td className={`${td} text-left px-1`}>
                            {x.remainingDue > 0
                              ? `বকেয়া ৳${bn(x.remainingDue)}`
                              : ""}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold bg-slate-100 break-inside-avoid">
                      <td className={td}>মোট</td>
                      <td className={td}>
                        {bn(sum(m.map((x) => x.previousDue)))}
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
    <Suspense fallback={null}>
      <LedgerView />
    </Suspense>
  );
}
