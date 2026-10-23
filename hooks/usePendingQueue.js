"use client";

import { useEffect, useState } from "react";
import { getQueue, subscribe } from "@/lib/offlineQueue";

// the list of changes that are still waiting to be synced (updates by itself)
export default function usePendingQueue() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getQueue()
        .then((q) => alive && setItems(q))
        .catch(() => {});
    load();
    const off = subscribe(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return items;
}
