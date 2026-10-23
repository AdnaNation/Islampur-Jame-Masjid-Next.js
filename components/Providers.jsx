"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import OfflineProvider from "@/components/OfflineProvider";

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { networkMode: "offlineFirst" },
          mutations: { networkMode: "always" },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineProvider />
      {children}
    </QueryClientProvider>
  );
}
