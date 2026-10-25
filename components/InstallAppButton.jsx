"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdInstallMobile } from "react-icons/md";
import useInstallApp from "@/hooks/useInstallApp";

function HelpModal({ ios, onClose }) {
  // Escape closes it, and the page behind does not scroll while it is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="অ্যাপ হিসেবে ইন্সটল করুন"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4"
      onClick={onClose}
    >
      {/* max height + scroll: the whole text can always be reached, even on a short screen */}
      <div
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0f3d2e]">
            অ্যাপ হিসেবে ইন্সটল করুন
          </h2>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="text-2xl text-slate-500"
          >
            <MdClose />
          </button>
        </div>

        {ios ? (
          <ol className="mt-3 space-y-2 text-sm list-decimal list-inside text-slate-700">
            <li>
              এই সাইটটি <b>Safari</b> ব্রাউজারে খুলুন (অন্য ব্রাউজারে হবে না)।
            </li>
            <li>
              স্ক্রিনের নিচের (বা উপরের) <b>Share</b> বাটন চাপুন।
            </li>
            <li>
              <b>Add to Home Screen</b> বেছে নিয়ে <b>Add</b> চাপুন।
            </li>
          </ol>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              <b>অ্যান্ড্রয়েড (Chrome):</b> ঠিকানার ডানের <b>⋮</b> মেনু চাপুন,
              তারপর <b>Install app</b> বা <b>Add to Home screen</b>।
            </li>
            <li>
              <b>কম্পিউটার (Chrome / Edge):</b> ঠিকানার ডানদিকের{" "}
              <b>ইন্সটল আইকন (⊕)</b> চাপুন।
            </li>
          </ul>
        )}

        <p className="mt-3 text-xs text-slate-500">
          অপশন না দেখালে সাইটটি লাইভ (https) ঠিকানায় খুলে একবার রিলোড করুন।
        </p>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-[#0f3d2e] py-2.5 text-sm font-semibold text-white"
        >
          বুঝেছি
        </button>
      </div>
    </div>
  );
}

// variant="desktop": small outlined pill for the navbar   variant="mobile": full row in the phone menu
export default function InstallAppButton({ variant = "desktop" }) {
  const { ready, canPrompt, installed, ios, install } = useInstallApp();
  const [help, setHelp] = useState(false);

  if (!ready || installed) return null; // already installed: nothing to show

  const onClick = () => (canPrompt ? install() : setHelp(true));

  return (
    <>
      {variant === "mobile" ? (
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-slate-700 transition active:bg-slate-100"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xl text-[#0f3d2e]">
            <MdInstallMobile />
          </span>
          অ্যাপ ইন্সটল করুন
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-[#0f3d2e] transition hover:bg-emerald-100"
        >
          <MdInstallMobile className="text-lg" />
        </button>
      )}

      {/* Rendered straight into <body>. Inside the navbar it would be cut off, because the navbar
          (backdrop-blur) and its phone menu (overflow-hidden) trap "fixed" children. */}
      {help &&
        createPortal(
          <HelpModal ios={ios} onClose={() => setHelp(false)} />,
          document.body,
        )}
    </>
  );
}
