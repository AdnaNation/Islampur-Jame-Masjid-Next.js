"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-5 py-2 text-sm font-semibold text-white rounded-lg bg-[#0f3d2e] hover:bg-[#0c3226]"
    >
      প্রিন্ট / PDF সংরক্ষণ
    </button>
  );
}
