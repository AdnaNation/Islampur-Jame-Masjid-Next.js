"use client";

import { useState } from "react";

const btn = "px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-60";

export default function SlipActions({ targetId = "slip", fileName = "slip" }) {
  const [busy, setBusy] = useState(null); // "png" | "jpg" | null

  async function download(format) {
    try {
      setBusy(format);
      const { toPng, toJpeg } = await import("html-to-image");
      const node = document.getElementById(targetId);
      if (!node) throw new Error("Slip not found");
      await document.fonts?.ready;

      const options = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff", // JPG has no transparency, so this matters
        quality: 0.95, // used for JPG only
        style: { boxShadow: "none", borderRadius: "0", margin: "0" },
      };

      const dataUrl =
        format === "jpg"
          ? await toJpeg(node, options)
          : await toPng(node, options);

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileName}.${format}`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("ইমেজ ডাউনলোড করা যায়নি");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4 print:hidden">
      <button
        type="button"
        onClick={() => download("png")}
        disabled={busy !== null}
        className={`${btn} text-white bg-[#2f7d57] hover:bg-[#276b4a]`}
      >
        {busy === "png" ? "অপেক্ষা করুন..." : "PNG ডাউনলোড"}
      </button>
      <button
        type="button"
        onClick={() => download("jpg")}
        disabled={busy !== null}
        className={`${btn} text-[#0f3d2e] bg-white border border-[#0f3d2e] hover:bg-slate-50`}
      >
        {busy === "jpg" ? "অপেক্ষা করুন..." : "JPG ডাউনলোড"}
      </button>
    </div>
  );
}
