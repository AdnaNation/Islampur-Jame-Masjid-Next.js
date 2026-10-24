"use client";

import { useState } from "react";
import { FiPlayCircle, FiX, FiExternalLink } from "react-icons/fi";

// ---- edit here -------------------------------------------------------------
const REEL_ID = "2569793933444022";
const REEL_URL = `https://www.facebook.com/reel/${REEL_ID}`;
const EMBED_SRC = `https://www.facebook.com/plugins/video.php?height=314&href=${encodeURIComponent(
  REEL_URL + "/",
)}&show_text=false&width=560&t=0`;
// -----------------------------------------------------------------------------

/**
 * "How to pay" video. Collapsed by default; the Facebook player (which is heavy)
 * is only loaded after the visitor taps, so the payment form stays fast.
 */
export default function PayHelpVideo() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center w-full gap-3 p-3 mt-5 text-left transition bg-white border shadow-sm rounded-xl border-slate-200 hover:border-[#0f3d2e]/40"
      >
        <span className="flex items-center justify-center w-11 h-11 rounded-full bg-[#0f3d2e] text-[#c9a24b] shrink-0">
          <FiPlayCircle className="text-2xl" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[#0f3d2e]">
            কীভাবে চাঁদা দেবেন? ভিডিওতে দেখুন
          </span>
          <span className="block text-xs text-slate-500">
            ২ মিনিটের সহজ টিউটোরিয়াল
          </span>
        </span>
      </button>
    );
  }

  return (
    <section className="p-3 mt-5 bg-white border shadow-sm rounded-xl border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-[#0f3d2e]">
          কীভাবে চাঁদা দেবেন?
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="ভিডিও বন্ধ করুন"
          className="p-1 rounded-full text-slate-500 hover:bg-slate-100"
        >
          <FiX />
        </button>
      </div>

      <div
        className="relative w-full overflow-hidden bg-white rounded-lg"
        style={{ aspectRatio: "560 / 429" }}
      >
        <iframe
          src={EMBED_SRC}
          title="কীভাবে চাঁদা পরিশোধ করবেন"
          loading="lazy"
          className="absolute inset-0 w-full h-full"
          style={{ border: "none", overflow: "hidden" }}
          scrolling="no"
          frameBorder="0"
          allowFullScreen={true}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        />
      </div>

      <a
        href={REEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-[#0f3d2e] hover:underline"
      >
        ভিডিও না চললে Facebook-এ দেখুন <FiExternalLink />
      </a>
    </section>
  );
}
