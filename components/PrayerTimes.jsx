// "use client";

// import { useEffect, useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import {
//   IoMoonOutline,
//   IoMoon,
//   IoSunnyOutline,
//   IoSunny,
//   IoPartlySunnyOutline,
//   IoCloudyNightOutline,
// } from "react-icons/io5";

// const PRAYERS = [
//   { key: "Fajr", label: "ফজর", icon: IoMoonOutline },
//   { key: "Sunrise", label: "সূর্যোদয়", icon: IoSunnyOutline },
//   { key: "Dhuhr", label: "যোহর", icon: IoSunny },
//   { key: "Asr", label: "আসর", icon: IoPartlySunnyOutline },
//   { key: "Maghrib", label: "মাগরিব", icon: IoCloudyNightOutline },
//   { key: "Isha", label: "এশা", icon: IoMoon },
// ];

// const WAQT_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// function toMinutes(hhmm) {
//   const [h, m] = hhmm.split(":").map(Number);
//   return h * 60 + m;
// }

// function nowInDhakaMinutes() {
//   const parts = new Intl.DateTimeFormat("en-GB", {
//     timeZone: "Asia/Dhaka",
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: false,
//   }).formatToParts(new Date());
//   const h = Number(parts.find((p) => p.type === "hour").value);
//   const m = Number(parts.find((p) => p.type === "minute").value);
//   return h * 60 + m;
// }

// function to12Hour(hhmm) {
//   const [h, m] = hhmm.split(":").map(Number);
//   const period = h >= 12 ? "PM" : "AM";
//   const hour12 = h % 12 === 0 ? 12 : h % 12;
//   return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
// }

// const PrayerTimes = () => {
//   const [nowMinutes, setNowMinutes] = useState(null);

//   useEffect(() => {
//     setNowMinutes(nowInDhakaMinutes());
//     const interval = setInterval(() => {
//       setNowMinutes(nowInDhakaMinutes());
//     }, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   const { data, isPending, isError } = useQuery({
//     queryKey: ["prayer-times"],
//     queryFn: async () => {
//       const res = await fetch("/api/prayer-times");
//       if (!res.ok) throw new Error("Failed to load prayer times");
//       return res.json();
//     },
//     staleTime: 1000 * 60 * 60, // 1 hour
//   });

//   let activeKey = null;
//   if (data && nowMinutes !== null) {
//     for (let i = WAQT_ORDER.length - 1; i >= 0; i--) {
//       const key = WAQT_ORDER[i];
//       if (toMinutes(data.timings[key]) <= nowMinutes) {
//         activeKey = key;
//         break;
//       }
//     }

//     if (!activeKey) activeKey = "Isha";
//   }
//   return (
//     <div className="max-w-3xl px-4 py-3 mx-auto my-8 bg-slate-100">
//       <div className="flex flex-col mb-1 text-center gap-y-1">
//         <h2 className="text-2xl font-bold">নামাজের সময়সূচী</h2>
//         <p className="text-gray-900 text-md">ইসলামপুর জামে মসজিদ</p>
//         <p className="text-sm text-gray-500">দাগনভূঞা, ফেনী</p>
//         {data && (
//           <p className="mt-1 text-xs text-gray-400">
//             {data.date} {data.hijri ? `· ${data.hijri}` : ""}
//           </p>
//         )}
//       </div>

//       {isPending && (
//         <div className="py-6 text-center text-gray-400">লোড হচ্ছে...</div>
//       )}

//       {isError && (
//         <div className="py-6 text-sm text-center text-red-500">
//           নামাজের সময় লোড করা যায়নি। পরে আবার চেষ্টা করুন।
//         </div>
//       )}

//       {data && (
//         <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
//           {PRAYERS.map(({ key, label, icon: Icon }) => {
//             const isActive = key === activeKey;
//             return (
//               <div
//                 key={key}
//                 className={`flex flex-col items-center rounded-xl border p-4 shadow-sm transition ${
//                   isActive
//                     ? "bg-emerald-600 text-white border-emerald-600"
//                     : "bg-white border-gray-200"
//                 }`}
//               >
//                 <Icon className="mb-1 text-3xl" />
//                 <span className="font-semibold">{label}</span>
//                 <span className="text-lg">{to12Hour(data.timings[key])}</span>
//                 {isActive && (
//                   <span className="text-[10px] uppercase tracking-wide mt-1 opacity-90">
//                     চলছে
//                   </span>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PrayerTimes;

"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IoMoonOutline,
  IoMoon,
  IoSunnyOutline,
  IoSunny,
  IoPartlySunnyOutline,
  IoCloudyNightOutline,
} from "react-icons/io5";
import useAdmin from "@/hooks/useAdmin";

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
  if (!hhmm) return "--:--";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

const PrayerTimes = () => {
  const queryClient = useQueryClient();
  const [isAdmin] = useAdmin();

  const [nowMinutes, setNowMinutes] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});

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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: async (timings) => {
      const res = await fetch("/api/prayer-times", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timings }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-times"] });
      setIsEditing(false);
    },
  });

  const startEditing = () => {
    const initial = {};
    for (const key of WAQT_ORDER) initial[key] = data?.timings?.[key] || "";
    setForm(initial);
    mutation.reset();
    setIsEditing(true);
  };

  let activeKey = null;
  if (data && nowMinutes !== null) {
    for (let i = WAQT_ORDER.length - 1; i >= 0; i--) {
      const key = WAQT_ORDER[i];
      const t = data.timings[key];
      if (t && toMinutes(t) <= nowMinutes) {
        activeKey = key;
        break;
      }
    }

    // before Fajr → still Isha's window
    if (!activeKey && data.timings.Isha) activeKey = "Isha";
  }

  return (
    <div className="max-w-3xl px-4 py-3 mx-auto my-8 bg-slate-100">
      <div className="flex flex-col mb-1 text-center gap-y-1">
        <h2 className="text-2xl font-bold">নামাজের সময়সূচী</h2>
        <p className="text-gray-900 text-md">ইসলামপুর জামে মসজিদ</p>
        <p className="text-sm text-gray-500">দাগনভূঞা, ফেনী</p>
        {data && (data.date || data.hijri) && (
          <p className="mt-1 text-xs text-gray-400">
            {data.date} {data.hijri ? `· ${data.hijri}` : ""}
          </p>
        )}
      </div>

      {isPending && (
        <div className="py-6 text-center text-gray-400">লোড হচ্ছে...</div>
      )}

      {isError && (
        <div className="py-6 text-sm text-center text-red-500">
          নামাজের সময় লোড করা যায়নি। পরে আবার চেষ্টা করুন।
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 mt-3 md:grid-cols-3 md:gap-4">
            {PRAYERS.map(({ key, label, icon: Icon }) => {
              const isActive = !isEditing && key === activeKey;
              const isManual = WAQT_ORDER.includes(key);

              return (
                <div
                  key={key}
                  className={`flex flex-col items-center rounded-xl border p-4 shadow-sm transition ${
                    isActive
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Icon className="mb-1 text-3xl" />
                  <span className="font-semibold">{label}</span>
                  {isEditing && isManual ? (
                    <input
                      type="time"
                      value={form[key] || ""}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      className="px-2 py-1 mt-1 text-base border rounded"
                    />
                  ) : (
                    <span className="text-lg">
                      {to12Hour(data.timings[key])}
                    </span>
                  )}

                  {isActive && (
                    <span className="text-[10px] uppercase tracking-wide mt-1 opacity-90">
                      চলছে
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            সর্বশেষ আপডেট: {data?.updatedAt || "অজানা"}
          </p>
          {/* admin controls: everyone else sees nothing here */}
          {isAdmin && (
            <div className="mt-4 text-center">
              {isEditing ? (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => mutation.mutate(form)}
                    disabled={mutation.isPending}
                    className="px-5 py-2 text-white rounded bg-emerald-600 disabled:opacity-50"
                  >
                    {mutation.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={mutation.isPending}
                    className="px-5 py-2 bg-white border rounded"
                  >
                    বাতিল
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditing}
                  className="px-5 py-2 text-white rounded bg-slate-700"
                >
                  সময় পরিবর্তন করুন
                </button>
              )}

              {mutation.isError && (
                <p className="mt-2 text-sm text-red-500">
                  {mutation.error.message}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PrayerTimes;
