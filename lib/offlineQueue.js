// Offline write queue, stored in the phone's IndexedDB.
// Safe to import anywhere: nothing touches the browser until a function is called.

const DB_NAME = "masjid-offline";
const STORE = "queue";
const CHANNEL = "masjid-queue";
const EVENT = "masjid-queue-changed";
const MAX_ATTEMPTS = 8; // server errors are retried this many times, then shown as failed

export const QUEUED_TEXT =
  "অফলাইনে সংরক্ষিত — ইন্টারনেট এলে নিজে থেকেই সিঙ্ক হবে";

// ---------------------------------------------------------------------------
// WHICH requests may wait for the internet. Everything else (SMS, WhatsApp,
// closing the year, revert, approve ...) must be online, so it is NOT queued.
// ---------------------------------------------------------------------------
const ID = "[^/]+";
const ALLOW = [
  ["POST", /^\/transactions$/],
  ["PATCH", new RegExp(`^/transactions/${ID}$`)],
  ["DELETE", new RegExp(`^/transactions/${ID}$`)],
  ["POST", /^\/account-categories$/],
  ["PATCH", new RegExp(`^/account-categories/${ID}$`)],
  ["DELETE", new RegExp(`^/account-categories/${ID}$`)],
  ["PUT", /^\/account-settings$/],
  ["POST", /^\/combined-payment$/],
  ["POST", /^\/payment$/],
  ["PATCH", /^\/monthStatus$/],
  ["PATCH", new RegExp(`^/tarabeePaid/${ID}$`)],
  ["PATCH", new RegExp(`^/payDue/${ID}$`)],
  ["PATCH", new RegExp(`^/editFee/${ID}$`)],
  ["PATCH", new RegExp(`^/editUserData/${ID}$`)],
  ["POST", /^\/addUser$/],
  ["POST", /^\/addShopKeeper$/],
];

const pathOf = (url) => String(url || "").split("?")[0];

export const isQueueable = (method, url) =>
  ALLOW.some(
    ([m, re]) => m === String(method).toUpperCase() && re.test(pathOf(url)),
  );

// short Bengali name shown in the "waiting to sync" list
export function describe(method, url, d = {}) {
  const p = pathOf(url);
  const n = (v) => Number(v || 0).toLocaleString("bn-BD");
  if (p === "/transactions")
    return `${d.type === "income" ? "আয়" : "ব্যয়"} এন্ট্রি ৳${n(d.amount)}`;
  if (p.startsWith("/transactions/"))
    return method === "DELETE" ? "এন্ট্রি মোছা" : "এন্ট্রি সম্পাদনা";
  if (p === "/account-categories") return `নতুন ক্যাটাগরি: ${d.name || ""}`;
  if (p.startsWith("/account-categories/"))
    return method === "DELETE" ? "ক্যাটাগরি মোছা" : "ক্যাটাগরির নাম বদল";
  if (p === "/account-settings") return "হিসাবের শুরুর তারিখ ও ফান্ড";
  if (p === "/combined-payment") return `চাঁদা গ্রহণ: ${d.name || ""}`;
  if (p === "/payment") return `পেমেন্ট রেকর্ড: ${d.name || ""}`;
  if (p === "/monthStatus") return `মাস পরিশোধ: ${d.selectedMonth || ""}`;
  if (p.startsWith("/tarabeePaid/")) return "তারাবীর চাঁদা পরিশোধ";
  if (p.startsWith("/payDue/")) return "বকেয়া পরিশোধ";
  if (p.startsWith("/editFee/")) return "চাঁদার হার পরিবর্তন";
  if (p.startsWith("/editUserData/")) return "সদস্যের তথ্য পরিবর্তন";
  if (p === "/addUser") return `নতুন সদস্য: ${d.NameBn || d.Name || ""}`;
  if (p === "/addShopKeeper")
    return `নতুন দোকানদার: ${d.NameBn || d.Name || ""}`;
  return `${method} ${p}`;
}

// ---- ids ---------------------------------------------------------------------
const hex = (bytes) =>
  [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
const rand = (n) => {
  const a = new Uint8Array(n);
  globalThis.crypto.getRandomValues(a); // browsers (and Node 20+) always have this
  return a;
};
export const newKey = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : hex(rand(16));
// a valid MongoDB ObjectId made on the phone (so a new category can be used before it is synced)
export const newObjectId = () =>
  Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0") + hex(rand(8));

export const isQueued = (res) => res?.data?.queued === true;

// ---- IndexedDB helpers -----------------------------------------------------
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore(STORE, {
        keyPath: "id",
        autoIncrement: true,
      });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, make) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = make(t.objectStore(STORE));
      t.oncomplete = () => resolve(req?.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}

// ---- change notifications (this tab + other tabs) ------------------------------
let channel;
const getChannel = () => {
  if (channel === undefined)
    channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(CHANNEL)
        : null;
  return channel;
};
function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
  try {
    getChannel()?.postMessage("changed");
  } catch {}
}
export function subscribe(fn) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, fn);
  const ch = getChannel();
  const onMsg = () => fn();
  ch?.addEventListener("message", onMsg);
  return () => {
    window.removeEventListener(EVENT, fn);
    ch?.removeEventListener("message", onMsg);
  };
}

// ---- queue ---------------------------------------------------------------------
export async function getQueue() {
  const all = (await run("readonly", (s) => s.getAll())) || [];
  return all.sort((a, b) => a.id - b.id);
}

export async function enqueue({ method, url, data, key }) {
  const item = {
    method: String(method).toUpperCase(),
    url:
      pathOf(url) +
      (String(url).includes("?") ? "?" + String(url).split("?")[1] : ""),
    data,
    key: key || newKey(),
    label: describe(String(method).toUpperCase(), url, data),
    createdAt: Date.now(),
    status: "pending", // "pending" | "failed"
    attempts: 0,
  };
  await run("readwrite", (s) => s.add(item));
  notify();
  return item;
}

export async function removeItem(id) {
  await run("readwrite", (s) => s.delete(id));
  notify();
}

export async function updateItem(id, patch) {
  const cur = await run("readonly", (s) => s.get(id));
  if (!cur) return;
  await run("readwrite", (s) => s.put({ ...cur, ...patch }));
  notify();
}

export const retryItem = (id) =>
  updateItem(id, {
    status: "pending",
    attempts: 0,
    error: "",
    httpStatus: undefined,
  });

// ---- turn a failed axios call into a saved request -----------------------------
// Returns a fake "202 queued" response, or null when the request must NOT be queued.
export async function maybeQueue(error) {
  const cfg = error?.config;
  if (!cfg || error.response) return null; // the server answered: a real error, not "offline"
  if (error.code === "ERR_CANCELED") return null;
  const method = String(cfg.method || "get").toUpperCase();
  if (method === "GET" || method === "HEAD" || !isQueueable(method, cfg.url))
    return null;

  let data = cfg.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  } else if (
    data !== undefined &&
    typeof data === "object" &&
    data?.constructor?.name === "FormData"
  ) {
    return null;
  }
  const key =
    (typeof cfg.headers?.get === "function"
      ? cfg.headers.get("Idempotency-Key")
      : cfg.headers?.["Idempotency-Key"]) || newKey();

  await enqueue({ method, url: cfg.url, data, key });
  return {
    data: { queued: true, offline: true },
    status: 202,
    statusText: "Saved offline",
    headers: {},
    config: cfg,
    request: null,
  };
}

// ---- send the saved requests, oldest first -----------------------------------
async function withLock(fn) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(
      "masjid-queue-drain",
      { ifAvailable: true },
      (lock) => (lock ? fn() : { sent: 0, failed: 0, skipped: true }),
    );
  }
  return fn();
}

export function drain() {
  return withLock(async () => {
    const items = (await getQueue()).filter((i) => i.status === "pending");
    let sent = 0;
    let failed = 0;
    for (const it of items) {
      let res;
      try {
        res = await fetch(`/api${it.url}`, {
          method: it.method,
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": it.key,
            "X-Queued-At": new Date(it.createdAt).toISOString(), // real time of the action
          },
          body: it.data === undefined ? undefined : JSON.stringify(it.data),
        });
      } catch {
        return { sent, failed, stopped: true }; // still offline: keep order, try later
      }

      if (res.ok) {
        await removeItem(it.id);
        sent++;
        continue;
      }

      // Signed out / session expired: keep every saved item as it is and stop.
      // They are sent after the admin signs in again (nothing is lost).
      if (res.status === 401) {
        if (typeof window !== "undefined")
          window.dispatchEvent(new Event("masjid-auth-expired"));
        return { sent, failed, stopped: true, authRequired: true };
      }

      let message = "";
      try {
        message = (await res.json())?.message || "";
      } catch {}

      const transient =
        res.status >= 500 ||
        res.status === 408 ||
        res.status === 409 ||
        res.status === 429;
      if (transient) {
        const attempts = (it.attempts || 0) + 1;
        if (attempts >= MAX_ATTEMPTS) {
          await updateItem(it.id, {
            status: "failed",
            attempts,
            error: message || `সার্ভারে সমস্যা (${res.status})`,
          });
          failed++;
          continue;
        }
        await updateItem(it.id, { attempts });
        return { sent, failed, stopped: true };
      }

      // the server refused it (bad data / already gone): needs a human look
      await updateItem(it.id, {
        status: "failed",
        error: message || `গ্রহণ করা হয়নি (${res.status})`,
        httpStatus: res.status,
      });
      failed++;
    }
    return { sent, failed, stopped: false };
  });
}

// ---------------------------------------------------------------------------
// "Pending effects": show a member as already paid while the payment is still
// waiting in the queue (so the same money is not collected twice).
// ---------------------------------------------------------------------------
export function applyPendingToUser(u, items) {
  if (!u || !items?.length) return u;
  const uid = String(u._id);
  let out = null;
  const edit = () => {
    if (!out) {
      out = {
        ...u,
        PayMonths: (u.PayMonths || []).map((m) => ({ ...m })),
        Tarabi: u.Tarabi ? { ...u.Tarabi } : u.Tarabi,
      };
    }
    return out;
  };
  const payMonths = (names) => {
    const o = edit();
    o.PayMonths.forEach((m) => {
      if (names.includes(m.monthName)) m.status = "paid";
    });
  };
  const tarabiPaid = () => {
    const o = edit();
    o.Tarabi = { ...(o.Tarabi || {}), status: "paid" };
  };

  for (const it of items) {
    if (it.status !== "pending") continue;
    const d = it.data || {};
    if (it.url === "/monthStatus" && String(d.id) === uid)
      payMonths([d.selectedMonth]);
    else if (it.url === `/tarabeePaid/${uid}`) tarabiPaid();
    else if (it.url === `/payDue/${uid}`) edit().Due = d.DueFee;
    else if (it.url === "/combined-payment" && String(d.userId) === uid) {
      if (d.monthly?.months?.length) payMonths(d.monthly.months);
      if (d.tarabi) tarabiPaid();
      if (d.due)
        edit().Due = Number(edit().Due || 0) - Number(d.due.amount || 0);
    }
  }
  return out || u;
}
