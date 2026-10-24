"use client";

import { useState } from "react";
import { MdClose, MdInstallMobile } from "react-icons/md";
import useInstallApp from "@/hooks/useInstallApp";

function HelpModal({ ios, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
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
          <ol className="mt-3 space-y-2 text-sm text-slate-700 list-decimal list-inside">
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
          ডেভেলপমেন্ট মোডে (`npm run dev`) ইন্সটল হয় না।
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

export default function InstallAppButton({ variant = "desktop" }) {
  const { ready, canPrompt, installed, ios, install } = useInstallApp();
  const [help, setHelp] = useState(false);

  if (!ready || installed) return null;

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
          <MdInstallMobile className="text-lg" /> অ্যাপ ইন্সটল
        </button>
      )}
      {help && <HelpModal ios={ios} onClose={() => setHelp(false)} />}
    </>
  );
}
