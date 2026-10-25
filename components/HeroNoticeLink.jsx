"use client";

import Link from "next/link";
import { MdCampaign } from "react-icons/md";
import useNotices from "@/hooks/useNotices";
import { isRecent } from "@/lib/noticeFormat";

// Hero button -> /notices, with a pulsing dot when a notice is under a week old.
export default function HeroNoticeLink() {
  const { data: notices = [] } = useNotices(3);
  const hasNew = notices.some((n) => isRecent(n.date));

  return (
    <Link
      href="/notices"
      className="relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full bg-amber-400 text-[#0f3d2e] shadow hover:bg-amber-300"
    >
      <MdCampaign className="text-lg" />
      নোটিশ বোর্ড
      {hasNew && (
        <span className="absolute flex w-3 h-3 -right-0.5 -top-0.5">
          <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-rose-400" />
          <span className="relative inline-flex w-3 h-3 rounded-full bg-rose-500" />
        </span>
      )}
    </Link>
  );
}
