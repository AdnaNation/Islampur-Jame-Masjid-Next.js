"use client";

import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "./useAxiosPublic";

// latest notices (newest first, no long body). limit 3 = homepage, 100 = full list.
export default function useNotices(limit = 3) {
  const axiosPublic = useAxiosPublic();
  return useQuery({
    queryKey: ["notices", limit],
    queryFn: async () =>
      (await axiosPublic.get(`/notices?limit=${limit}`)).data,
    staleTime: 60 * 1000,
  });
}
