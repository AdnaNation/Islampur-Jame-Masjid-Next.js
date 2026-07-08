"use client";

import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "./useAxiosPublic";
import { getLocalStorage } from "@/lib/localStorage";

const useUsers = () => {
  const axiosPublic = useAxiosPublic();
  const search = getLocalStorage("search");
  const home = getLocalStorage("homeName");
  const banglaText = getLocalStorage("Bangla");
  const {
    data: users = [],
    isPending: isUsersLoading,
    refetch,
  } = useQuery({
    queryKey: ["users", search, home, banglaText],
    queryFn: async () => {
      const res = await axiosPublic.get(
        `/users?search=${search}&HomeName=${home}&searchBn=${banglaText}`
      );
      return res.data;
    },
  });
  return [users, isUsersLoading, refetch];
};

export default useUsers;
