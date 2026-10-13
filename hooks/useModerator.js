"use client";

import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "./useAxiosPublic";
import { getLocalStorage } from "@/lib/localStorage";

const useModerator = () => {
  const axiosPublic = useAxiosPublic();
  const number = getLocalStorage("Number");
  const { data: isModerator, isPending: isModeratorLoading } = useQuery({
    queryKey: [number, "isModerator"],
    queryFn: async () => {
      const res = await axiosPublic.get(`/verifyModerator/${number}`);
      return res.data;
    },
  });
  return [isModerator, isModeratorLoading];
};

export default useModerator;
