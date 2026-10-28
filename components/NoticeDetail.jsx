"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MdArrowBack } from "react-icons/md";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import NoticeSheets from "@/components/NoticeSheets";
import LedgerActions from "@/components/LedgerActions";
import { PageLoader } from "@/components/Loader";

export default function NoticeDetail({ id, initialNotice }) {
  const axiosPublic = useAxiosPublic();
  const {
    data: notice,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["notice", id],
    queryFn: async () => (await axiosPublic.get(`/notices/${id}`)).data,
    initialData: initialNotice,
    retry: false,
  });

  return (
    <div className="bg-[#f7f5ef] min-h-screen px-2 py-6 print:p-0 print:bg-white">
      <div className="max-w-3xl mx-auto mb-4 print:hidden">
        <Link
          href="/notices"
          className="inline-flex items-center gap-1 text-sm text-[#0f3d2e] hover:underline"
        >
          <MdArrowBack /> সব নোটিশ
        </Link>
      </div>

      {isPending && <PageLoader />}
      {isError && (
        <p className="py-10 text-center text-rose-600">
          নোটিশটি পাওয়া যায়নি।
        </p>
      )}

      {notice && (
        <>
          <div className="max-w-3xl mx-auto mb-4 print:hidden">
            <LedgerActions
              containerId="notice-sheet"
              fileName={`notice-${notice.date}`}
            />
          </div>
          <NoticeSheets notice={notice} />
        </>
      )}
    </div>
  );
}
