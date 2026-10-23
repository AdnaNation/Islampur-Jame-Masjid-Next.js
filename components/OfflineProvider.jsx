"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MdCheckCircle,
  MdClose,
  MdCloudOff,
  MdDownload,
  MdErrorOutline,
  MdSync,
} from "react-icons/md";
import {
  drain,
  getQueue,
  removeItem,
  retryItem,
  subscribe,
} from "@/lib/offlineQueue";
import { registerServiceWorker, warmOfflineCache } from "@/lib/pwa";

const bn = (n) => Number(n).toLocaleString("bn-BD");
const timeText = (ms) =>
  new Date(ms).toLocaleTimeString("bn-BD", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });

export default function OfflineProvider() {
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(true);
  const [items, setItems] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [open, setOpen] = useState(false);
  const [installEvt, setInstallEvt] = useState(null);
  const [installHidden, setInstallHidden] = useState(true);
  const flushing = useRef(false);

  const pending = items.filter((i) => i.status === "pending");
  const failed = items.filter((i) => i.status === "failed");

  const reload = useCallback(
    () =>
      getQueue()
        .then(setItems)
        .catch(() => {}),
    [],
  );

  // send everything that is waiting (oldest first)
  const flush = useCallback(async () => {
    if (flushing.current || !navigator.onLine) return;
    const waiting = (await getQueue().catch(() => [])).filter(
      (i) => i.status === "pending",
    );
    if (!waiting.length) return;
    flushing.current = true;
    setSyncing(true);
    try {
      const r = await drain();
      if (r?.sent > 0) {
        await queryClient.invalidateQueries(); // pages show the fresh server data
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 4000);
      }
    } finally {
      flushing.current = false;
      setSyncing(false);
      reload();
    }
  }, [queryClient, reload]);

  // start-up: service worker, saved pages, saved changes
  useEffect(() => {
    setOnline(navigator.onLine);
    registerServiceWorker();
    warmOfflineCache();
    setInstallHidden(localStorage.getItem("masjid-install-hidden") === "1");
    reload();
    if (navigator.onLine) flush();

    // lazy parts of the app are fetched once while online, so they also work offline
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 4000));
    idle(() => {
      if (!navigator.onLine) return;
      import("@/components/fee/FeeDetailsModal").catch(() => {});
      import("html-to-image").catch(() => {});
    });
  }, [flush, reload]);

  // connection changes
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      flush();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [flush]);

  // queue changed (this tab or another one)
  useEffect(() => subscribe(reload), [reload]);

  // weak connection: the browser says "online" but sending failed - try again now and then
  useEffect(() => {
    if (!pending.length) return;
    const t = setInterval(() => navigator.onLine && flush(), 20000);
    return () => clearInterval(t);
  }, [pending.length, flush]);

  // nothing left to show: close the panel, so it does not pop up already open next time
  useEffect(() => {
    if (online && !pending.length && !failed.length) setOpen(false);
  }, [online, pending.length, failed.length]);

  // "install app" button
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice.catch(() => {});
    setInstallEvt(null);
  };
  const hideInstall = () => {
    localStorage.setItem("masjid-install-hidden", "1");
    setInstallHidden(true);
  };

  const showInstall = !!installEvt && !installHidden;
  if (
    online &&
    !pending.length &&
    !failed.length &&
    !syncing &&
    !justSynced &&
    !showInstall
  )
    return null;

  // what the little button says
  let tone = "bg-emerald-700";
  let Icon = MdCheckCircle;
  let text = "সব পরিবর্তন সিঙ্ক হয়েছে";
  let spin = false;
  if (failed.length) {
    tone = "bg-rose-600";
    Icon = MdErrorOutline;
    text = `${bn(failed.length)} টি সিঙ্ক হয়নি — দেখুন`;
  } else if (syncing) {
    tone = "bg-emerald-700";
    Icon = MdSync;
    spin = true;
    text = "সিঙ্ক হচ্ছে…";
  } else if (!online) {
    tone = "bg-amber-600";
    Icon = MdCloudOff;
    text = pending.length
      ? `অফলাইন • ${bn(pending.length)} টি পরিবর্তন অপেক্ষমাণ`
      : "অফলাইন — সংরক্ষিত তথ্য দেখানো হচ্ছে";
  } else if (pending.length) {
    tone = "bg-sky-700";
    Icon = MdSync;
    text = `${bn(pending.length)} টি পরিবর্তন সিঙ্কের অপেক্ষায়`;
  } else if (justSynced) {
    // default
  } else if (showInstall) {
    tone = "bg-[#0f3d2e]";
    Icon = MdDownload;
    text = "অ্যাপ ইন্সটল করুন";
  }

  const canOpen = pending.length || failed.length || !online;

  return (
    <div className="fixed z-40 bottom-4 left-4 print:hidden">
      {open && canOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-[min(92vw,22rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50">
            <p className="text-sm font-semibold text-slate-800">অফলাইন সিঙ্ক</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="বন্ধ করুন"
              className="text-lg text-slate-500"
            >
              <MdClose />
            </button>
          </div>

          <p className="px-3 pt-2 text-xs text-slate-500">
            {online
              ? "ইন্টারনেট আছে। অপেক্ষমাণ পরিবর্তনগুলো পাঠানো হচ্ছে।"
              : "ইন্টারনেট নেই। পরিবর্তনগুলো এই ফোনে সংরক্ষিত আছে, ইন্টারনেট এলে নিজে থেকেই সিঙ্ক হবে।"}
          </p>

          <ul className="px-3 py-1 overflow-y-auto divide-y max-h-64 divide-slate-100">
            {items.length === 0 && (
              <li className="py-3 text-sm text-slate-400">
                কিছু অপেক্ষমাণ নেই।
              </li>
            )}
            {items.map((it) => (
              <li key={it.id} className="py-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm break-words text-slate-800">
                    {it.label}
                  </p>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {timeText(it.createdAt)}
                  </span>
                </div>
                {it.status === "failed" ? (
                  <div className="mt-1">
                    <p className="text-xs break-words text-rose-600">
                      {it.error}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs">
                      <button
                        onClick={() => retryItem(it.id).then(flush)}
                        className="text-[#0f3d2e] underline"
                      >
                        আবার চেষ্টা
                      </button>
                      <button
                        onClick={() => removeItem(it.id)}
                        className="underline text-rose-600"
                      >
                        বাতিল করুন
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600">সিঙ্কের অপেক্ষায়</p>
                )}
              </li>
            ))}
          </ul>

          {online && pending.length > 0 && (
            <div className="p-2 border-t">
              <button
                onClick={flush}
                disabled={syncing}
                className="w-full rounded-lg bg-[#0f3d2e] py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                এখনই সিঙ্ক করুন
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center overflow-hidden text-white rounded-full shadow-lg">
        <button
          onClick={() =>
            showInstall && !canOpen && !syncing && !justSynced
              ? install()
              : setOpen((v) => !v)
          }
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium ${tone}`}
        >
          <Icon className={`text-lg ${spin ? "animate-spin" : ""}`} />
          {text}
        </button>
        {showInstall && !canOpen && !syncing && !justSynced && (
          <button
            onClick={hideInstall}
            aria-label="লুকান"
            className={`px-3 py-2.5 text-lg ${tone} border-l border-white/20`}
          >
            <MdClose />
          </button>
        )}
      </div>
    </div>
  );
}
