"use client";

import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "./useAxiosPublic";

const useNumbers = () => {
  const axiosPublic = useAxiosPublic();
  const { data: usersNumber = [] } = useQuery({
    queryKey: ["usersNumber"],
    queryFn: async () => {
      const res = await axiosPublic.get("/usersNumber");
      return res.data;
    },
  });
  return [usersNumber];
};

export default useNumbers;
