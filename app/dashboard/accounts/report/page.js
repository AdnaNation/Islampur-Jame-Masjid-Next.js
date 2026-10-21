"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import LedgerActions from "@/components/LedgerActions";
import {
  YMD,
  amt,
  buildReport,
  closingLabel,
  rangeLabel,
  titleRange,
} from "@/lib/accountReport";

const field =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0f3d2e] focus:outline-none";

function Box({ title, rows, total }) {
  return (
    <table className="w-full text-[11px] text-black border-collapse table-fixed">
      <colgroup>
        <col style={{ width: "46%" }} />
        <col style={{ width: "54%" }} />
      </colgroup>
      <thead>
        <tr>
          <th
            colSpan={2}
            className="border-2 border-black py-2.5 text-[17px] font-bold"
          >
            {title}
          </th>
        </tr>
        <tr>
          <th className="border border-black py-1.5 font-semibold">খাত</th>
          <th className="border border-black py-1.5 font-semibold">
            টাকার পরিমাণ
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.name}-${i}`}>
            <td className="px-1.5 py-2 font-semibold text-left break-words border border-black">
              {r.name}
            </td>
            <td className="px-1 font-bold text-center border border-black">
              {amt(r.total)}
            </td>
          </tr>
        ))}
        <tr>
          <td className="px-1 py-1 text-right text-[10px] font-semibold">
            সর্বমোট=
          </td>
          <td className="border-2 border-black py-2 text-center text-[14px] font-bold">
            {amt(total)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function ReportView() {
  const axiosPublic = useAxiosPublic();
  const params = useSearchParams();
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Dhaka",
  });
  const [from, setFrom] = useState(
    params.get("from") || `${today.slice(0, 4)}-01-01`,
  );
  const [to, setTo] = useState(params.get("to") || today);
  const [openingInput, setOpeningInput] = useState("");

  const ready = YMD.test(from) && YMD.test(to) && from <= to;

  const { data, isPending, isError, isPlaceholderData } = useQuery({
    queryKey: ["accountReport", from, to],
    enabled: ready,
    queryFn: async () =>
      (await axiosPublic.get("/transactions/report", { params: { from, to } }))
        .data,
    placeholderData: keepPreviousData,
  });

  const report = useMemo(
    () => (data && ready ? buildReport(data, from, openingInput) : null),
    [data, ready, from, openingInput],
  );

  const accountsLink = `/dashboard/accounts${
    ready ? `?from=${from}&to=${to}` : ""
  }`;

  return (
    <main id="report-root" className="p-4 bg-white">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          #report-root, #report-root * { visibility: visible !important; }
          html, body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mb-5 space-y-3 print:hidden">
        <div className="flex flex-wrap items-end justify-center gap-3">
          <label className="block">
            <span className="block text-xs text-slate-500">শুরুর তারিখ</span>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className={field}
            />
          </label>
          <label className="block">
            <span className="block text-xs text-slate-500">শেষ তারিখ</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className={field}
            />
          </label>
          <label className="block">
            <span className="block text-xs text-slate-500">
              পূর্বের অবশিষ্ট ফান্ড (৳)
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={openingInput}
              onChange={(e) => setOpeningInput(e.target.value)}
              placeholder={
                report ? `স্বয়ংক্রিয়: ${report.autoOpening}` : "স্বয়ংক্রিয়"
              }
              className={`${field} w-44`}
            />
          </label>
        </div>
        <p className="text-xs text-center text-slate-500">
          শুরুর তারিখের আগের সব আয়-ব্যয়ের হিসাব থেকে “অবশিষ্ট ফান্ড” নিজে
          থেকেই বের হয়। আগের এন্ট্রি না থাকলে বা অন্য অঙ্ক দিতে চাইলে ঘরে নিজে
          লিখুন। ০ লিখলে ওই লাইন বাদ যাবে।
        </p>

        {data?.memberFees?.total > 0 && (
          <p className="text-xs text-center text-slate-500">
            “মাসিক চাঁদা” লাইনে মেম্বারদের পেমেন্ট নিজে থেকেই যোগ হয় (বাতিল করা
            বাদে): মাসিক {amt(data.memberFees.monthly)} + তারাবী{" "}
            {amt(data.memberFees.tarabi)} + বকেয়া {amt(data.memberFees.due)} ={" "}
            {amt(data.memberFees.total)}
          </p>
        )}

        {ready && report && <LedgerActions fileName="accounts-report" />}
        <p className="text-xs text-center text-slate-500">
          PDF-এর জন্য “প্রিন্ট / PDF” চেপে “Save as PDF” ও “Portrait” বেছে নিন।
        </p>
        <div className="text-center">
          <Link
            href={accountsLink}
            className="text-sm text-[#0f3d2e] underline"
          >
            ← আয়-ব্যয়ের পেজে ফিরুন
          </Link>
        </div>
      </div>

      {!ready && (
        <p className="text-center text-rose-600 print:hidden">
          সঠিক তারিখের ব্যাপ্তি দিন (শুরু ≤ শেষ)।
        </p>
      )}
      {ready && isPending && (
        <p className="text-center print:hidden">লোড হচ্ছে...</p>
      )}
      {ready && isError && (
        <p className="text-center text-rose-600 print:hidden">
          রিপোর্ট লোড করা যায়নি।
        </p>
      )}

      {ready && report && (
        <div
          id="report-sheet"
          className={`overflow-x-auto print:overflow-visible ${
            isPlaceholderData ? "opacity-60" : ""
          }`}
        >
          <section
            data-ledger-page
            data-name={`${from}_to_${to}`}
            className="mx-auto w-[794px] min-h-[1123px] bg-white px-14 py-10 text-black print:min-h-0 print:w-full print:p-0"
          >
            <h1 className="mb-5 text-center text-[15px] font-bold">
              ইসলামপুর জামে মসজিদের হিসাব ({titleRange(from, to)})
            </h1>

            <Box
              title={`আয়ের হিসাব (${rangeLabel(from, to)})`}
              rows={report.income}
              total={report.totalIncome}
            />
            <div className="h-10" />
            <Box
              title={`ব্যয়ের হিসাব (${rangeLabel(from, to)})`}
              rows={report.expense}
              total={report.totalExpense}
            />

            <div className="mt-12 space-y-0.5 text-[10px]">
              <div className="grid grid-cols-[1fr_150px]">
                <span>{rangeLabel(from, to)} পর্যন্ত সর্বমোট আয়</span>
                <b className="text-[12px] text-center">
                  {amt(report.totalIncome)}
                </b>
              </div>
              <div className="grid grid-cols-[1fr_150px]">
                <span>{rangeLabel(from, to)} পর্যন্ত সর্বমোট ব্যয়</span>
                <b className="text-[12px] text-center">
                  {amt(report.totalExpense)}
                </b>
              </div>
              <div className="grid grid-cols-[1fr_150px] items-end border-t border-black pt-1">
                <span>{closingLabel(to)}</span>
                <b className="text-[15px] text-center">
                  {amt(report.remaining)}
                </b>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default function AccountsReportPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center">লোড হচ্ছে...</p>}>
      <ReportView />
    </Suspense>
  );
}
