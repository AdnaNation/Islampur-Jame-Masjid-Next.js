"use client";

import { useEffect, useMemo, useState } from "react";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import { HistorySkeleton } from "./Loader";

const TYPE_LABEL = {
  Monthly: "মাসিক চাঁদা",
  Tarabi: "তারাবীর চাঁদা",
  Due: "বকেয়া",
};

// payment.time is saved as en-US "M/D/YYYY, h:mm:ss AM" (Asia/Dhaka).
// Show it as "D/M/YYYY".
const formatDate = (time) => {
  if (!time) return "";
  const [datePart] = String(time).split(",");
  const [m, d, y] = datePart.trim().split("/");
  return m && d && y ? `${d}/${m}/${y}` : datePart;
};

const PaymentHistory = ({ userId }) => {
  const axiosPublic = useAxiosPublic();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    axiosPublic
      .get(`/userPaymentHistory/${userId}`)
      .then((res) => {
        if (!cancelled) setPayments(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, axiosPublic]);

  // group by year, newest year first (API already returns newest payment first)
  const groups = useMemo(() => {
    const map = new Map();
    for (const p of payments) {
      const y = p.year;
      if (!map.has(y)) map.set(y, { year: y, items: [], total: 0 });
      const g = map.get(y);
      g.items.push(p);
      g.total += Number(p.fee) || 0;
    }
    return [...map.values()].sort((a, b) => b.year - a.year);
  }, [payments]);

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">পেমেন্ট হিস্ট্রি (গত ২ বছর)</h2>

      {loading && <HistorySkeleton />}
      {!loading && error && (
        <p className="text-sm text-red-600">পেমেন্ট হিস্ট্রি লোড করা যায়নি।</p>
      )}

      {!loading && !error && groups.length === 0 && (
        <p className="p-3 text-sm text-center text-gray-500 border rounded-lg">
          গত ২ বছরে কোনো পেমেন্ট পাওয়া যায়নি।
        </p>
      )}

      {!loading &&
        !error &&
        groups.map((g) => (
          <div key={g.year} className="overflow-hidden border rounded-lg">
            <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold bg-gray-100">
              <span>{g.year}</span>
              <span>মোট: ৳{g.total}</span>
            </div>
            <ul className="divide-y">
              {g.items.map((p) => (
                <li
                  key={p._id}
                  className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {TYPE_LABEL[p.type] || p.type}
                      {p.type === "Monthly" && p.monthName
                        ? ` (${p.monthName})`
                        : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(p.time)}
                      {p.method ? ` • ${p.method}` : ""}
                    </p>
                  </div>
                  <span className="font-semibold whitespace-nowrap">
                    ৳{p.fee}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
};

export default PaymentHistory;
