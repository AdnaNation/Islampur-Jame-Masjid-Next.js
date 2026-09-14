"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const Quran = () => {
  const [surahNo, setSurahNo] = useState(1);
  const lang = "bn";
  useEffect(() => {
    setSurahNo(1);
  }, [setSurahNo]);

  const { data, isLoading, isError, error } = useQuery({
    // Include parameters so cache invalidates automatically when surahNo or lang changes
    queryKey: ["quran", "surah", surahNo, lang],
    queryFn: async () => {
      const res = await fetch(
        `https://alquran-api.pages.dev/api/quran/surah/${surahNo}?lang=${lang}`,
      );
      if (!res.ok) throw new Error("Failed to load Surah data");
      return res.json();
    },
  });

  console.log(data);

  if (isLoading) return <div>Loading Surah...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return <div>This is Quran page</div>;
};

export default Quran;
