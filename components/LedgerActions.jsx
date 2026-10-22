"use client";

import { useState } from "react";
import { BtnLoading } from "./Loader";

const btn = "px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-60";

export default function LedgerActions({
  containerId = "ledger-sheets",
  fileName = "ledger",
}) {
  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState("");

  async function download(format) {
    try {
      setBusy(format);
      const { toPng, toJpeg } = await import("html-to-image");
      const nodes = document.querySelectorAll(
        `#${containerId} [data-ledger-page]`,
      );
      if (!nodes.length) throw new Error("No pages found");
      await document.fonts?.ready;

      const options = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        quality: 0.95, // JPG only
        style: { margin: "0", border: "0" },
      };

      for (let i = 0; i < nodes.length; i++) {
        setProgress(`${i + 1}/${nodes.length}`);
        const node = nodes[i];
        const dataUrl =
          format === "jpg"
            ? await toJpeg(node, options)
            : await toPng(node, options);

        const label = (node.dataset.name || `page-${i + 1}`).replace(
          /[\\/:*?"<>|\s]+/g,
          "-",
        );
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${fileName}-${label}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        // small gap so the browser accepts several downloads in a row
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (e) {
      console.error(e);
      alert("ইমেজ ডাউনলোড করা যায়নি");
    } finally {
      setBusy(null);
      setProgress("");
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className={`${btn} text-white bg-[#0f3d2e] hover:bg-[#0c3226]`}
      >
        প্রিন্ট / PDF
      </button>
      <button
        type="button"
        onClick={() => download("png")}
        disabled={busy !== null}
        className={`${btn} text-white bg-[#2f7d57] hover:bg-[#276b4a]`}
      >
        {busy === "png" ? (
          <BtnLoading text={`অপেক্ষা করুন ${progress}`} />
        ) : (
          "PNG (প্রতি পৃষ্ঠা)"
        )}
      </button>
      <button
        type="button"
        onClick={() => download("jpg")}
        disabled={busy !== null}
        className={`${btn} text-[#0f3d2e] bg-white border border-[#0f3d2e] hover:bg-slate-50`}
      >
        {busy === "jpg" ? (
          <BtnLoading text={`অপেক্ষা করুন ${progress}`} />
        ) : (
          "JPG (প্রতি পৃষ্ঠা)"
        )}
        {busy === "jpg" ? (
          <BtnLoading text={`অপেক্ষা করুন ${progress}`} />
        ) : (
          "JPG (প্রতি পৃষ্ঠা)"
        )}
      </button>
    </div>
  );
}
