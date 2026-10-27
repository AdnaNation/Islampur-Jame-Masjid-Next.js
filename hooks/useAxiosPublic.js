import axios from "axios";
import { isQueueable, maybeQueue, newKey } from "@/lib/offlineQueue";

const axiosPublic = axios.create({
  baseURL: "/api",
});

axiosPublic.interceptors.request.use((config) => {
  const method = String(config.method || "get").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    if (!config.headers.get?.("Idempotency-Key"))
      config.headers.set("Idempotency-Key", newKey());
    // on a bad connection, give up after 20s and save it for later instead of hanging
    if (isQueueable(method, config.url) && !config.timeout)
      config.timeout = 20000;
  }
  return config;
});

// no internet: allowed requests are saved in the phone and sent later
axiosPublic.interceptors.response.use(undefined, async (error) => {
  if (typeof window !== "undefined") {
    // signed out / session expired: let the app re-check who is signed in
    if (
      error?.response?.status === 401 &&
      !String(error.config?.url || "").includes("/auth/")
    )
      window.dispatchEvent(new Event("masjid-auth-expired"));
    const queued = await maybeQueue(error).catch(() => null);
    if (queued) return queued;
  }
  return Promise.reject(error);
});

const useAxiosPublic = () => {
  return axiosPublic;
};

export default useAxiosPublic;
