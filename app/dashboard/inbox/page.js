"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  MdArrowBack,
  MdChatBubbleOutline,
  MdSearch,
  MdSend,
  MdPause,
  MdPlayArrow,
} from "react-icons/md";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import { ChatListSkeleton, ChatThreadSkeleton } from "@/components/Loader";

const PAGE_SIZE = 100;

const TYPE_LABEL = {
  image: "📷 ছবি",
  audio: "🎤 ভয়েস মেসেজ",
  video: "🎥 ভিডিও",
  document: "📄 ডকুমেন্ট",
  sticker: "স্টিকার",
  location: "📍 লোকেশন",
  contacts: "👤 কন্টাক্ট",
  reaction: "রিয়্যাকশন",
};
const bodyOf = (m) => m?.text || TYPE_LABEL[m?.type] || `[${m.type}]`;

const prettyNumber = (id = "") => {
  const s = String(id);
  if (s.includes(".")) return s;
  return s.startsWith("880") ? "0" + s.slice(3) : s;
};
const titleOf = (c) => c?.name || prettyNumber(c?.waId);

const toDhaka = (d) =>
  new Date(d.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
const dhakaNow = () => toDhaka(new Date());
const LEGACY = /^\d{1,2}\/\d{1,2}\/\d{4},/;
const parse = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return typeof v === "string" && LEGACY.test(v) ? d : toDhaka(d);
};
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const clock = (d) =>
  `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${
    d.getHours() >= 12 ? "PM" : "AM"
  }`;
const dayLabel = (d, now) => {
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (dayKey(d) === dayKey(now)) return "আজ";
  if (dayKey(d) === dayKey(y)) return "গতকাল";
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
};
const listTime = (v) => {
  const d = parse(v);
  if (!d) return "";
  const now = dhakaNow();
  return dayKey(d) === dayKey(now) ? clock(d) : dayLabel(d, now);
};

const Avatar = ({ c }) => (
  <span className="flex items-center justify-center w-11 h-11 text-lg font-semibold text-white rounded-full shrink-0 bg-[#14523d]">
    {(titleOf(c) || "?").trim().charAt(0).toUpperCase()}
  </span>
);

const InboxPage = () => {
  const axiosPublic = useAxiosPublic();
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const {
    data: conversations = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["inbox"],
    queryFn: async () => (await axiosPublic.get("/inbox")).data,
    refetchInterval: 5000,
    placeholderData: keepPreviousData,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      [c.name, c.waId, prettyNumber(c.waId), c.last?.text]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [conversations, query]);

  const { data: thread, refetch: refetchThread } = useQuery({
    queryKey: ["inboxThread", selectedId, limit],
    queryFn: async () =>
      (
        await axiosPublic.get(
          `/inbox?waId=${encodeURIComponent(selectedId)}&limit=${limit}`,
        )
      ).data,
    enabled: !!selectedId,
    refetchInterval: 3000,
    placeholderData: keepPreviousData,
  });

  const messages = thread?.messages;
  const items = useMemo(() => {
    const now = dhakaNow();
    const out = [];
    let lastDay = null;
    (messages || []).forEach((m, i) => {
      const d = parse(m.updatedAt);
      const k = d ? dayKey(d) : "unknown";
      if (k !== lastDay) {
        lastDay = k;
        if (d)
          out.push({ kind: "day", key: `d-${k}`, label: dayLabel(d, now) });
      }
      out.push({
        kind: "msg",
        key: m.messageId || `m-${i}`,
        m,
        time: d ? clock(d) : "",
      });
    });
    return out;
  }, [messages]);

  const lastId = messages?.[messages.length - 1]?.messageId;
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [selectedId, lastId]);

  const openChat = (id) => {
    setSelectedId(id);
    setLimit(PAGE_SIZE);
    setReply("");
  };

  const selected =
    conversations.find((c) => c.waId === selectedId) ||
    (thread ? { waId: thread.waId, name: thread.name } : null);

  const isHuman = thread?.botStatus === "human";

  const sendReply = async () => {
    if (!reply.trim() || !selectedId || sending) return;
    setSending(true);
    try {
      await axiosPublic.post("/inbox", {
        waId: selectedId,
        text: reply.trim(),
      });
      setReply("");
      setTimeout(() => refetchThread(), 500);
    } catch (e) {
      alert("পাঠানো যায়নি: " + (e.response?.data?.error || e.message));
    }
    setSending(false);
  };

  const toggleBot = async () => {
    if (!selectedId) return;
    try {
      await axiosPublic.put("/inbox", {
        waId: selectedId,
        action: isHuman ? "resume" : "pause",
      });
      refetchThread();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-2 sm:p-4">
      <div className="flex h-[calc(100vh-9rem)] min-h-[480px] overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
        {/* left */}
        <aside
          className={`${selectedId ? "hidden md:flex" : "flex"} w-full flex-col border-r border-slate-200 md:w-80 lg:w-96 md:shrink-0`}
        >
          <div className="p-3 border-b border-slate-200">
            <h1 className="text-lg font-bold text-[#0f3d2e]">
              হোয়াটসঅ্যাপ ইনবক্স
            </h1>
            <div className="relative mt-2">
              <MdSearch className="absolute text-xl -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="নাম, নম্বর বা মেসেজ খুঁজুন"
                className="w-full py-2 pl-10 pr-3 text-sm border rounded-lg border-slate-300 focus:border-[#0f3d2e] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isPending ? (
              <ChatListSkeleton />
            ) : isError ? (
              <div className="p-6 text-sm text-center text-rose-600">
                লোড হয়নি।{" "}
                <button onClick={() => refetch()} className="underline">
                  আবার চেষ্টা করুন
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-6 text-sm text-center text-slate-500">
                {query ? "কিছু পাওয়া যায়নি।" : "এখনো কোনো মেসেজ আসেনি।"}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <li key={c.waId}>
                    <button
                      onClick={() => openChat(c.waId)}
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-slate-50 ${selectedId === c.waId ? "bg-emerald-50" : ""}`}
                    >
                      <Avatar c={c} />
                      <span className="flex-1 min-w-0">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold truncate text-slate-900">
                            {titleOf(c)}
                          </span>
                          <span className="text-[11px] shrink-0 text-slate-400">
                            {listTime(c.last?.updatedAt)}
                          </span>
                        </span>
                        <span className="block text-sm truncate text-slate-500">
                          {bodyOf(c.last) || "—"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* right */}
        <section
          className={`${selectedId ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-[#efeae2]`}
        >
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
              <MdChatBubbleOutline className="text-5xl" />
              <p className="mt-2 text-sm">বামদিক থেকে একটি চ্যাট বেছে নিন</p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 px-3 py-2 bg-white border-b border-slate-200">
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-1 text-2xl md:hidden text-slate-600"
                >
                  <MdArrowBack />
                </button>
                {selected && <Avatar c={selected} />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-slate-900">
                    {titleOf(selected)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {prettyNumber(selectedId)}{" "}
                    {thread?.total ? `• মোট ${thread.total} টি` : ""}{" "}
                    {isHuman && (
                      <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                        Human Mode
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={toggleBot}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${isHuman ? "bg-emerald-600 text-white" : "bg-orange-500 text-white"}`}
                >
                  {isHuman ? (
                    <>
                      <MdPlayArrow /> Resume Bot
                    </>
                  ) : (
                    <>
                      <MdPause /> Take Over
                    </>
                  )}
                </button>
              </header>

              <div ref={scrollRef} className="flex-1 px-3 py-4 overflow-y-auto">
                {thread && thread.total > (messages?.length || 0) && (
                  <div className="mb-3 text-center">
                    <button
                      onClick={() => setLimit((l) => l + PAGE_SIZE)}
                      className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#0f3d2e] shadow-sm hover:bg-slate-50"
                    >
                      আগের মেসেজ দেখুন ({thread.total - messages.length})
                    </button>
                  </div>
                )}
                {!thread ? (
                  <ChatThreadSkeleton />
                ) : (
                  <ul className="space-y-1.5">
                    {items.map((it) =>
                      it.kind === "day" ? (
                        <li key={it.key} className="py-2 text-center">
                          <span className="px-3 py-1 text-[11px] rounded-full bg-white/80 text-slate-500 shadow-sm">
                            {it.label}
                          </span>
                        </li>
                      ) : (
                        <li
                          key={it.key}
                          className={`flex ${it.m.from === "me" || it.m.from === "bot" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-1.5 shadow-sm sm:max-w-[70%] ${it.m.from === "me" ? "bg-[#d9fdd3] rounded-tr-none" : it.m.from === "bot" ? "bg-[#dcf8c6] rounded-tr-none" : "bg-white rounded-tl-none"}`}
                          >
                            {/* START IMAGE PREVIEW LOGIC */}
                            {it.m.mediaId && it.m.type === "image" ? (
                              <>
                                <img
                                  src={`/api/inbox/media?id=${it.m.mediaId}`}
                                  alt="image"
                                  className="rounded-lg max-w-[250px] max-h-[300px] object-cover mb-1"
                                />
                                {it.m.text &&
                                  it.m.text !== "📷 ছবি পাঠিয়েছে" && (
                                    <p className="whitespace-pre-wrap break-words text-[14px] text-slate-900">
                                      {it.m.text}
                                    </p>
                                  )}
                              </>
                            ) : it.m.mediaId &&
                              (it.m.type === "video" ||
                                it.m.type === "audio" ||
                                it.m.type === "document") ? (
                              <>
                                <a
                                  href={`/api/inbox/media?id=${it.m.mediaId}`}
                                  target="_blank"
                                  className="text-sm text-blue-600 underline"
                                >
                                  {it.m.type === "video"
                                    ? "🎥 ভিডিও দেখুন"
                                    : it.m.type === "audio"
                                      ? "🎤 ভয়েস শুনুন"
                                      : "📄 ডকুমেন্ট দেখুন"}
                                </a>
                                <p className="whitespace-pre-wrap break-words text-[14px] mt-1">
                                  {it.m.text}
                                </p>
                              </>
                            ) : (
                              <p
                                className={`whitespace-pre-wrap break-words text-[15px] ${it.m.text ? "text-slate-900" : "italic text-slate-500"}`}
                              >
                                {bodyOf(it.m) || "—"}
                              </p>
                            )}
                            {/* END LOGIC */}
                            <p className="mt-0.5 text-right text-[10px] text-slate-500">
                              {it.time} {it.m.from === "me" ? "✓✓" : ""}
                            </p>
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>

              {/* REPLY BOX */}
              <footer className="flex items-center gap-2 p-2 bg-white border-t border-slate-200">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="মেসেজ লিখুন..."
                  className="flex-1 px-4 py-2.5 text-[15px] border rounded-full border-slate-300 focus:border-[#0f3d2e] focus:outline-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-[#0f3d2e] disabled:opacity-50"
                >
                  <MdSend className="text-xl" />
                </button>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default InboxPage;
