import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

let indexReady = false;

export function clientIp(request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// returns a 429 response when over the limit, otherwise null
export async function rateLimit(request, { name, key, limit, windowSec }) {
  try {
    const client = await clientPromise;
    const c = client.db("MosqueDB").collection("rateLimits");
    if (!indexReady) {
      indexReady = true;
      c.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {
        indexReady = false;
      });
    }
    const who = key ?? clientIp(request);
    const bucket = Math.floor(Date.now() / (windowSec * 1000));
    const doc = await c.findOneAndUpdate(
      { _id: `${name}:${who}:${bucket}` },
      {
        $inc: { n: 1 },
        $setOnInsert: {
          expireAt: new Date((bucket + 1) * windowSec * 1000 + 60000),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    if ((doc?.n ?? 0) > limit) {
      const retry = Math.max(
        1,
        Math.ceil(((bucket + 1) * windowSec * 1000 - Date.now()) / 1000),
      );
      return NextResponse.json(
        { message: "অনেক বেশি চেষ্টা করা হয়েছে, একটু পরে আবার চেষ্টা করুন" },
        { status: 429, headers: { "Retry-After": String(retry) } },
      );
    }
  } catch (err) {
    console.error("rateLimit error:", err?.message);
  }
  return null;
}
