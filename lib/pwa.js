export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (process.env.NODE_ENV !== "production") return;
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
}

// ask the service worker to (re)save all pages for offline use - at most every 12 hours
export async function warmOfflineCache() {
  try {
    const last = Number(localStorage.getItem("masjid-warm-at") || 0);
    if (Date.now() - last < 12 * 60 * 60 * 1000) return;
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "WARM" });
    localStorage.setItem("masjid-warm-at", String(Date.now()));
  } catch {}
}

// on logout: forget the saved data answers (the pending changes are kept)
export async function clearApiCache() {
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "CLEAR_API" });
    localStorage.removeItem("masjid-warm-at");
  } catch {}
}
