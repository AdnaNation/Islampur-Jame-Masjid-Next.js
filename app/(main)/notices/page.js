"use client";

import Link from "next/link";
import { MdArrowBack, MdCampaign } from "react-icons/md";
import useNotices from "@/hooks/useNotices";
import { NoticeCard } from "@/components/NoticeBoard";
import { PageLoader } from "@/components/Loader";

export default function NoticesPage() {
  const { data: notices = [], isPending, isError } = useNotices(100);

  return (
    <div className="bg-[#f7f5ef] min-h-screen">
      <div className="max-w-3xl px-4 py-8 mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 mb-4 text-sm text-[#0f3d2e] hover:underline"
        >
          <MdArrowBack /> হোমে ফিরুন
        </Link>
        <h1 className="flex items-center gap-2 mb-5 text-2xl font-bold text-[#0f3d2e]">
          <MdCampaign className="text-3xl text-amber-600" />
          নোটিশ বোর্ড
        </h1>

        {isPending && <PageLoader />}
        {isError && (
          <p className="text-center text-rose-600">নোটিশ লোড করা যায়নি।</p>
        )}
        {!isPending && !isError && notices.length === 0 && (
          <p className="py-10 text-center text-slate-500">
            এখনো কোনো নোটিশ নেই।
          </p>
        )}
        <div className="space-y-3">
          {notices.map((n) => (
            <NoticeCard key={n._id} notice={n} />
          ))}
        </div>
      </div>
    </div>
  );
}
