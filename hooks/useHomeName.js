"use client";

import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "./useAxiosPublic";

const useHomeName = () => {
  const axiosPublic = useAxiosPublic();
  const { data: usersHome = [] } = useQuery({
    queryKey: ["usersHome"],
    queryFn: async () => {
      const res = await axiosPublic.get("/usersHome");
      return res.data;
    },
  });

  const homeName = [...new Set(usersHome.map((user) => user.HomeName))];
  return [homeName];
};

export default useHomeName;
