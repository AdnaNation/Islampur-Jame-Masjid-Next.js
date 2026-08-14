"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IoMoonOutline,
  IoMoon,
  IoSunnyOutline,
  IoSunny,
  IoPartlySunnyOutline,
  IoCloudyNightOutline,
} from "react-icons/io5";

const PRAYERS = [
  { key: "Fajr", label: "ফজর", icon: IoMoonOutline },
  { key: "Sunrise", label: "সূর্যোদয়", icon: IoSunnyOutline },
  { key: "Dhuhr", label: "যোহর", icon: IoSunny },
  { key: "Asr", label: "আসর", icon: IoPartlySunnyOutline },
  { key: "Maghrib", label: "মাগরিব", icon: IoCloudyNightOutline },
  { key: "Isha", label: "এশা", icon: IoMoon },
];

const WAQT_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function nowInDhakaMinutes() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour").value);
  const m = Number(parts.find((p) => p.type === "minute").value);
  return h * 60 + m;
}

function to12Hour(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

const PrayerTimes = () => {
  const [nowMinutes, setNowMinutes] = useState(null);

  useEffect(() => {
    setNowMinutes(nowInDhakaMinutes());
    const interval = setInterval(() => {
      setNowMinutes(nowInDhakaMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const { data, isPending, isError } = useQuery({
    queryKey: ["prayer-times"],
    queryFn: async () => {
      const res = await fetch("/api/prayer-times");
      if (!res.ok) throw new Error("Failed to load prayer times");
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  let nextKey = null;
  if (data && nowMinutes !== null) {
    nextKey =
      WAQT_ORDER.find((key) => toMinutes(data.timings[key]) > nowMinutes) ||
      "Fajr";
  }

  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <div className="text-center gap-y-1 flex flex-col mb-1">
        <h2 className="text-2xl font-bold">নামাজের সময়সূচী</h2>
        <p className="text-md text-gray-900">ইসলামপুর জামে মসজিদ</p>
        <p className="text-sm text-gray-500">দাগনভূঞা, ফেনী</p>
        {data && (
          <p className="text-xs text-gray-400 mt-1">
            {data.date} {data.hijri ? `· ${data.hijri}` : ""}
          </p>
        )}
      </div>

      {isPending && (
        <div className="text-center py-6 text-gray-400">লোড হচ্ছে...</div>
      )}

      {isError && (
        <div className="text-center py-6 text-red-500 text-sm">
          নামাজের সময় লোড করা যায়নি। পরে আবার চেষ্টা করুন।
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {PRAYERS.map(({ key, label, icon: Icon }) => {
            const isNext = key === nextKey;
            return (
              <div
                key={key}
                className={`flex flex-col items-center rounded-xl border p-4 shadow-sm transition ${
                  isNext
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white border-gray-200"
                }`}
              >
                <Icon className="text-3xl mb-1" />
                <span className="font-semibold">{label}</span>
                <span className="text-lg">{to12Hour(data.timings[key])}</span>
                {isNext && (
                  <span className="text-[10px] uppercase tracking-wide mt-1 opacity-90">
                    পরবর্তী নামাজ
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PrayerTimes;
