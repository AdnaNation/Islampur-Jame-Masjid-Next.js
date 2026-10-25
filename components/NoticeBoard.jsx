"use client";

import Link from "next/link";
import { MdCampaign, MdChevronRight } from "react-icons/md";
import useNotices from "@/hooks/useNotices";
import { isRecent, noticeDate } from "@/lib/noticeFormat";

export function NewBadge() {
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold text-white rounded-full bg-rose-500">
      নতুন
    </span>
  );
}

export function NoticeCard({ notice }) {
  return (
    <Link
      href={`/notices/${notice._id}`}
      className="block p-4 transition bg-white border shadow-sm rounded-2xl border-slate-200 hover:border-[#0f3d2e]/40 hover:shadow"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>{noticeDate(notice.date)}</span>
        {isRecent(notice.date) && <NewBadge />}
      </div>
      <h3 className="mt-1 font-bold text-[#0f3d2e] leading-snug">
        {notice.title}
        {notice.subject ? (
          <span className="font-semibold text-slate-700">
            {" "}
            — {notice.subject}
          </span>
        ) : null}
      </h3>
      {notice.excerpt && (
        <p className="mt-1 text-sm leading-relaxed text-slate-600 line-clamp-2">
          {notice.excerpt}
        </p>
      )}
      <span className="inline-flex items-center mt-2 text-xs font-semibold text-[#0f3d2e]">
        পুরো নোটিশ দেখুন <MdChevronRight className="text-base" />
      </span>
    </Link>
  );
}

// Homepage section: latest 3 notices. Hidden while loading or when there are none.
export default function NoticeBoard() {
  const { data: notices = [] } = useNotices(1);
  if (!notices.length) return null;

  return (
    <section aria-label="নোটিশ বোর্ড">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#0f3d2e]">
          <MdCampaign className="text-2xl text-amber-600" />
          নোটিশ বোর্ড
        </h2>
        <Link
          href="/notices"
          className="inline-flex items-center text-sm font-semibold text-[#0f3d2e] hover:underline"
        >
          সব নোটিশ <MdChevronRight className="text-lg" />
        </Link>
      </div>
      <div className="space-y-3">
        {notices.map((n) => (
          <NoticeCard key={n._id} notice={n} />
        ))}
      </div>
    </section>
  );
}
