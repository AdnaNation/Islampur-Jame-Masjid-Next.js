"use client";

import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/useAxiosPublic";

const LinkVisitsPage = () => {
  const axiosPublic = useAxiosPublic();

  const { data: visits = [], isPending } = useQuery({
    queryKey: ["link-visits"],
    queryFn: async () => {
      const res = await axiosPublic.get("/pay-link-visit");
      return res.data;
    },
  });

  return (
    <div className="max-w-2xl p-4 mx-auto">
      <h1 className="mb-4 text-xl font-bold">পেমেন্ট লিংক ভিজিট হিস্টোরি</h1>

      {isPending && <p className="text-gray-400">লোড হচ্ছে...</p>}
      {!isPending && visits.length === 0 && (
        <p className="text-gray-400">এখনো কেউ লিংক চেক করেনি।</p>
      )}

      <div className="space-y-3">
        {visits.map((v) => (
          <details
            key={v._id}
            className="p-3 bg-white border rounded-lg shadow-sm"
          >
            <summary className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-semibold">
                  {v.name || "অজানা"}{" "}
                  <span className="font-normal text-gray-500">
                    ({v.home || "N/A"}) - {v.number}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  সর্বশেষঃ {v.lastVisitedAt} · মোট {v.visits?.length || 0} বার
                </p>
              </div>
            </summary>
            <ul className="pl-4 mt-2 space-y-0.5 text-xs text-gray-500 list-disc">
              {v.visits
                ?.slice()
                .reverse()
                .map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
};

export default LinkVisitsPage;
