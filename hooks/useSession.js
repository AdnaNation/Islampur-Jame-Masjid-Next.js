"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAxiosPublic from "./useAxiosPublic";

export const ME_KEY = ["auth", "me"];

export default function useSession() {
  const axiosPublic = useAxiosPublic();
  const qc = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => (await axiosPublic.get("/auth/me")).data,
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const onExpired = () => qc.invalidateQueries({ queryKey: ME_KEY });
    window.addEventListener("masjid-auth-expired", onExpired);
    return () => window.removeEventListener("masjid-auth-expired", onExpired);
  }, [qc]);

  return { me: data ?? null, isPending };
}
