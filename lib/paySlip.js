import { randomInt } from "crypto";
import { getCollections } from "@/lib/mongodb";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLIP_ID_LENGTH = 10;

export const SLIP_ID_PATTERN = new RegExp(`^[a-z0-9]{${SLIP_ID_LENGTH}}$`);

function generateSlipId() {
  let id = "";
  for (let i = 0; i < SLIP_ID_LENGTH; i++) {
    id += ALPHABET[randomInt(ALPHABET.length)];
  }
  return id;
}

let indexReady = null;
function ensureIndex(collection) {
  if (!indexReady) {
    indexReady = collection
      .createIndex({ slipId: 1 }, { unique: true })
      .catch(() => {
        indexReady = null;
      });
  }
  return indexReady;
}

export async function createPaySlip({
  userId,
  name,
  home,
  items = [],
  method = "cash",
  trxID = null,
}) {
  try {
    const cleanItems = items
      .filter((i) => i && Number(i.amount) > 0)
      .map((i) => ({
        type: i.type,
        amount: Number(i.amount),
        ...(i.months?.length ? { months: i.months } : {}),
        paymentId: i.paymentId ? String(i.paymentId) : null,
      }));
    if (!cleanItems.length) return null;

    const { paySlipCollection } = await getCollections();
    await ensureIndex(paySlipCollection);

    const doc = {
      userId: userId ? String(userId) : null,
      name: name || null,
      home: home || null,
      method,
      trxID: trxID || null,
      items: cleanItems,
      total: cleanItems.reduce((sum, i) => sum + i.amount, 0),
      createdAt: new Date().toISOString(),
    };

    for (let attempt = 0; attempt < 3; attempt++) {
      const slipId = generateSlipId();
      try {
        await paySlipCollection.insertOne({ ...doc, slipId });
        return slipId;
      } catch (err) {
        if (err?.code !== 11000) throw err;
      }
    }
    return null;
  } catch (err) {
    console.error("createPaySlip failed:", err);
    return null;
  }
}

export async function getPaySlip(slipId) {
  if (!SLIP_ID_PATTERN.test(slipId)) return null;
  const { paySlipCollection } = await getCollections();
  return paySlipCollection.findOne(
    { slipId },
    { projection: { _id: 0, userId: 0 } },
  );
}
