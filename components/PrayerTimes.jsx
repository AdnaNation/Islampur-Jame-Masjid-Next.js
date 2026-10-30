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
  IoPeopleOutline,
} from "react-icons/io5";
import useAdmin from "@/hooks/useAdmin";
import useModerator from "@/hooks/useModerator";
import { BtnLoading, PrayerTimesSkeleton } from "./Loader";

// The six waqt cards (these are the ones admins can edit).
const MAIN_WAQT = [
  { key: "Fajr", label: "ফজর", icon: IoMoonOutline },
  { key: "Dhuhr", label: "যোহর", icon: IoSunny },
  { key: "Asr", label: "আসর", icon: IoPartlySunnyOutline },
  { key: "Maghrib", label: "মাগরিব", icon: IoCloudyNightOutline },
  { key: "Isha", label: "এশা", icon: IoMoon },
  { key: "Jummah", label: "জুমআ", icon: IoPeopleOutline },
];

// Not prayers, so they are shown as a small strip under the cards.
const EXTRA_TIMES = [
  { key: "Sunrise", label: "সূর্যোদয়", icon: IoSunnyOutline },
  { key: "Sunset", label: "সূর্যাস্ত", icon: IoCloudyNightOutline },
];

// Used to work out "next prayer" (Jummah is left out on purpose).
const NEXT_WAQT_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const WAQT_LABEL = Object.fromEntries(MAIN_WAQT.map((w) => [w.key, w.label]));

const WAQT_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Jummah"];

function to12Hour(hhmm) {
  if (!hhmm) return "--:--";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatUpdatedAt(value) {
  if (!value) return "অজানা";
  return new Date(value).toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function dhakaNowMinutes() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour").value);
  const m = Number(parts.find((p) => p.type === "minute").value);
  return h * 60 + m;
}

function getNextWaqt(timings, nowMin) {
  const list = NEXT_WAQT_KEYS.filter((k) => timings?.[k]).map((k) => {
    const [h, m] = timings[k].split(":").map(Number);
    return { key: k, min: h * 60 + m };
  });
  if (!list.length) return null;
  const upcoming = list.find((w) => w.min > nowMin);
  if (upcoming) return { key: upcoming.key, diff: upcoming.min - nowMin };
  // After Isha: the next one is tomorrow's Fajr.
  return { key: list[0].key, diff: list[0].min + 1440 - nowMin };
}

function formatDiff(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0 && m === 0) return "এখনই";
  const hours = h > 0 ? `${h.toLocaleString("bn-BD")} ঘণ্টা ` : "";
  const mins = m > 0 ? `${m.toLocaleString("bn-BD")} মিনিট ` : "";
  return `${hours}${mins}পরে`;
}

const PrayerTimes = ({ initialData }) => {
  const queryClient = useQueryClient();
  const [isAdmin] = useAdmin();
  const [isModerator] = useModerator();
  const canEdit = isAdmin || isModerator;
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [nowMin, setNowMin] = useState(null); // null on the server, avoids hydration mismatch

  useEffect(() => {
    const tick = () => setNowMin(dhakaNowMinutes());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const { data, isPending, isError } = useQuery({
    queryKey: ["prayer-times"],
    queryFn: async () => {
      const res = await fetch("/api/prayer-times");
      if (!res.ok) throw new Error("Failed to load prayer times");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    initialData,
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

  const next =
    data && nowMin !== null ? getNextWaqt(data.timings, nowMin) : null;

  return (
    <section className="overflow-hidden bg-white border shadow-sm rounded-2xl border-stone-200">
      <div className="px-5 py-5 text-center text-white bg-[#0f3d2e]">
        <h2 className="text-xl font-bold">নামাজের সময়সূচী</h2>
        <p className="mt-0.5 text-xs text-white/70">
          ইসলামপুর জামে মসজিদ · দাগনভূঞা, ফেনী
        </p>
        {data && (data.date || data.hijri) && (
          <p className="mt-1 text-xs text-white/60">
            {data.date} {data.hijri ? `· ${data.hijri}` : ""}
          </p>
        )}

        {next && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 mt-4 text-left rounded-xl bg-white/10">
            <div>
              <p className="text-xs text-white/70">পরবর্তী নামাজের জামাত</p>
              <p className="text-lg font-bold">
                {WAQT_LABEL[next.key]}{" "}
                <span className="text-sm font-medium text-white/80">
                  {to12Hour(data.timings[next.key])}
                </span>
              </p>
            </div>
            <p className="text-sm font-semibold text-amber-300">
              {formatDiff(next.diff)}
            </p>
          </div>
        )}
      </div>

      <div className="p-4">
        {isPending && <PrayerTimesSkeleton />}

        {isError && (
          <div className="py-6 text-sm text-center text-red-500">
            নামাজের সময় লোড করা যায়নি। পরে আবার চেষ্টা করুন।
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MAIN_WAQT.map(({ key, label, icon: Icon }) => {
                const isNext = next?.key === key;

                return (
                  <div
                    key={key}
                    className={`relative flex flex-col items-center rounded-xl border p-4 ${
                      isNext
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200 prayer-next"
                        : "border-stone-200 bg-stone-50"
                    }`}
                  >
                    {isNext && (
                      <span className="absolute px-2 py-0.5 text-[10px] font-semibold text-white rounded-full -top-2 bg-emerald-600">
                        পরবর্তী
                      </span>
                    )}
                    <Icon
                      className={`mb-1 text-3xl ${
                        isNext ? "text-emerald-700" : "text-stone-500"
                      }`}
                    />
                    <span className="font-semibold text-stone-800">
                      {label}
                    </span>
                    {isEditing ? (
                      <input
                        type="time"
                        value={form[key] || ""}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                        className="px-2 py-1 mt-1 text-base border rounded"
                      />
                    ) : (
                      <span className="text-xl font-bold tabular-nums text-[#0f3d2e]">
                        {to12Hour(data.timings[key])}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-3">
              {EXTRA_TIMES.map(({ key, label, icon: Icon }) => (
                <div
                  key={key}
                  className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg border-stone-200 bg-stone-50"
                >
                  <Icon className="text-lg text-stone-500" />
                  <span className="text-stone-600">{label}</span>
                  <span className="font-semibold tabular-nums">
                    {to12Hour(data.timings[key])}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-center text-gray-400">
              সর্বশেষ আপডেট: {formatUpdatedAt(data.updatedAt)}
            </p>

            {/* admin controls: everyone else sees nothing here */}
            {canEdit && (
              <div className="mt-4 text-center">
                {isEditing ? (
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => mutation.mutate(form)}
                      disabled={mutation.isPending}
                      className="px-5 py-2 text-white rounded bg-emerald-600 disabled:opacity-50"
                    >
                      {mutation.isPending ? (
                        <BtnLoading text="সেভ হচ্ছে..." />
                      ) : (
                        "সেভ করুন"
                      )}
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
    </section>
  );
};

export default PrayerTimes;
