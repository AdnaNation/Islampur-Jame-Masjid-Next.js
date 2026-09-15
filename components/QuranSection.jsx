"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaBook } from "react-icons/fa";
import useAxiosPublic from "@/hooks/useAxiosPublic";

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
    <div className="max-w-3xl mx-auto my-8 px-4 bg-slate-100 py-4">
      <div className="flex items-center justify-center gap-2 mb-4">
        <FaBook className="text-2xl text-emerald-700" />
        <h2 className="text-2xl font-bold">পবিত্র কুরআন তিলাওয়াত</h2>
      </div>

      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:justify-center">
        <select
          value={selectedSurah}
          onChange={handleSurahChange}
          className="max-w-xs select select-bordered"
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
            className="max-w-xs select select-bordered"
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
        <div className="mb-4">
          <audio key={currentAudioUrl} controls className="w-full">
            <source src={currentAudioUrl} type="audio/mpeg" />
          </audio>
        </div>
      )}

      {isSurahLoading && (
        <p className="text-center text-gray-400">লোড হচ্ছে...</p>
      )}

      {isError && (
        <p className="text-center text-red-500">
          সূরা লোড করা যায়নি। পরে আবার চেষ্টা করুন।
        </p>
      )}

      {surah && (
        <div>
          <div className="mb-3 text-center">
            <p className="text-xl font-semibold" dir="rtl">
              {surah.name}
            </p>
            <p className="text-sm text-gray-500">
              {surah.transliteration} · {surah.translation} ·{" "}
              {surah.type === "meccan" ? "মক্কী" : "মাদানী"}
            </p>
          </div>

          <div className="overflow-y-auto border rounded-lg max-h-96 bg-white">
            {surah.verses?.map((verse) => (
              <div key={verse.id} className="p-4 border-b last:border-b-0">
                <p
                  dir="rtl"
                  lang="ar"
                  className="mb-2 text-2xl leading-loose text-right"
                >
                  {verse.text}{" "}
                  <span className="text-sm text-emerald-700">({verse.id})</span>
                </p>
                <p className="text-sm text-gray-700">{verse.translation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuranSection;
