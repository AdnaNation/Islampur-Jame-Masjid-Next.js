"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaBook } from "react-icons/fa";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import { QuranSkeleton } from "./Loader";

const QuranSection = () => {
  const axiosPublic = useAxiosPublic();
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedReciter, setSelectedReciter] = useState("1");

  const { data: surahList = [] } = useQuery({
    queryKey: ["quran-surah-list"],
    queryFn: async () => {
      const res = await axiosPublic.get("/quran");
      return res.data;
    },
    staleTime: Infinity,
  });

  const {
    data: surah,
    isPending: isSurahLoading,
    isError,
  } = useQuery({
    queryKey: ["quran-surah", selectedSurah],
    queryFn: async () => {
      const res = await axiosPublic.get(`/quran/${selectedSurah}`);
      return res.data;
    },
    enabled: !!selectedSurah,
  });

  const reciters = surah?.audio ? Object.entries(surah.audio) : [];
  const currentAudioUrl = surah?.audio?.[selectedReciter]?.url;

  const handleSurahChange = (e) => {
    setSelectedSurah(Number(e.target.value));
  };

  return (
    <section className="overflow-hidden bg-white border shadow-sm rounded-2xl border-stone-200">
      <div className="flex items-center justify-center gap-2 px-5 py-4 text-white bg-[#0f3d2e]">
        <FaBook className="text-xl text-amber-300" />
        <h2 className="text-xl font-bold">পবিত্র কুরআন তিলাওয়াত</h2>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            value={selectedSurah}
            onChange={handleSurahChange}
            className="w-full select select-bordered"
          >
            {surahList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}. {s.transliteration} ({s.total_verses} আয়াত)
              </option>
            ))}
          </select>

          {reciters.length > 0 && (
            <select
              value={selectedReciter}
              onChange={(e) => setSelectedReciter(e.target.value)}
              className="w-full select select-bordered"
            >
              {reciters.map(([key, r]) => (
                <option key={key} value={key}>
                  {r.reciter}
                </option>
              ))}
            </select>
          )}
        </div>

        {currentAudioUrl && (
          <audio key={currentAudioUrl} controls className="w-full">
            <source src={currentAudioUrl} type="audio/mpeg" />
          </audio>
        )}

        {isSurahLoading && <QuranSkeleton />}

        {isError && (
          <p className="text-center text-red-500">
            সূরা লোড করা যায়নি। পরে আবার চেষ্টা করুন।
          </p>
        )}

        {surah && (
          <div>
            <div className="py-3 mb-3 text-center rounded-xl bg-emerald-50">
              <p className="text-3xl font-semibold text-[#0f3d2e]" dir="rtl">
                {surah.name}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {surah.transliteration} · {surah.translation} ·{" "}
                {surah.type === "meccan" ? "মক্কী" : "মাদানী"}
              </p>
            </div>

            <div className="overflow-y-auto bg-white border divide-y rounded-xl max-h-96 border-stone-200">
              {surah.verses?.map((verse) => (
                <div key={verse.id} className="p-4">
                  <p
                    dir="rtl"
                    lang="ar"
                    className="mb-2 text-2xl leading-loose text-right"
                  >
                    {verse.text}{" "}
                    <span className="text-sm text-emerald-700">
                      ({verse.id})
                    </span>
                  </p>
                  <p className="text-sm text-gray-700">{verse.translation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default QuranSection;
