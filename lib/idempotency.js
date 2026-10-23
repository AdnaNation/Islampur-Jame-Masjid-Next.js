import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const STALE_MS = 2 * 60 * 1000; // a "processing" claim older than this is assumed dead
let indexReady = false;

async function collection() {
  const client = await clientPromise;
  const c = client.db("MosqueDB").collection("idempotency");
  if (!indexReady) {
    indexReady = true;
    // forget keys after 14 days
    c.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 14 },
    ).catch(() => {
      indexReady = false;
    });
  }
  return c;
}

export async function withIdempotency(request, handler) {
  const key = request.headers.get("idempotency-key");
  if (!key || key.length > 100) return handler();

  const c = await collection();
  const id = `${request.method} ${new URL(request.url).pathname} ${key}`;
  const now = new Date();

  try {
    await c.insertOne({
      _id: id,
      state: "processing",
      createdAt: now,
      startedAt: now,
    });
  } catch (err) {
    if (err?.code !== 11000) throw err;
    const prev = await c.findOne({ _id: id });
    if (prev?.state === "done") {
      return NextResponse.json(prev.body ?? null, {
        status: prev.status || 200,
      });
    }
    // still running somewhere: only take over if that attempt looks dead
    const taken = await c.findOneAndUpdate(
      {
        _id: id,
        state: "processing",
        startedAt: { $lt: new Date(Date.now() - STALE_MS) },
      },
      { $set: { startedAt: new Date() } },
    );
    if (!taken) {
      return NextResponse.json(
        { message: "আগের অনুরোধটি এখনো চলছে" },
        { status: 409 },
      );
    }
  }

  try {
    const res = await handler();
    if (res.status >= 500) {
      await c.deleteOne({ _id: id }); // server trouble: allow a real retry
    } else {
      const body = await res
        .clone()
        .json()
        .catch(() => null);
      await c.updateOne(
        { _id: id },
        { $set: { state: "done", status: res.status, body } },
      );
    }
    return res;
  } catch (err) {
    await c.deleteOne({ _id: id }).catch(() => {});
    throw err;
  }
}

// When an action waited offline, use the time it REALLY happened (not the sync time).
export function actionTime(request) {
  const q = Date.parse(request.headers.get("x-queued-at") || "");
  const ageOk =
    Number.isFinite(q) &&
    Date.now() - q < 45 * 24 * 60 * 60 * 1000 &&
    q <= Date.now() + 5 * 60 * 1000;
  return ageOk ? new Date(q) : new Date();
}
