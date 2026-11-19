import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { bad, isId } from "@/lib/validate";

export async function PATCH(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!isId(id)) return bad("ভুল আইডি");

  const { userCollection, feeRateChangeCollection } = await getCollections();

  const latest = await feeRateChangeCollection.findOne(
    { reverted: { $ne: true } },
    { sort: { at: -1 }, projection: { _id: 1 } },
  );
  if (!latest || String(latest._id) !== id)
    return bad("শুধু সবচেয়ে শেষ পরিবর্তনটিই বাতিল করা যায়", 400);

  const log = await feeRateChangeCollection.findOneAndUpdate(
    { _id: new ObjectId(id), reverted: { $ne: true } },
    { $set: { reverted: true, revertedAt: new Date() } },
    { returnDocument: "before" },
  );
  if (!log) return bad("এই পরিবর্তন আগেই বাতিল করা হয়েছে", 409);

  try {
    const ops = (log.changes || []).map((c) => ({
      updateOne: {
        filter: { _id: new ObjectId(c.id), FeeRate: c.to },
        update: { $set: { FeeRate: c.from } },
      },
    }));
    const result = ops.length
      ? await userCollection.bulkWrite(ops, { ordered: false })
      : { modifiedCount: 0 };
    const restored = result.modifiedCount;
    await feeRateChangeCollection.updateOne(
      { _id: log._id },
      { $set: { restored } },
    );
    return NextResponse.json({
      success: true,
      restored,
      skipped: (log.changes || []).length - restored,
    });
  } catch (err) {
    await feeRateChangeCollection
      .updateOne(
        { _id: log._id },
        { $set: { reverted: false }, $unset: { revertedAt: "" } },
      )
      .catch(() => {});
    throw err;
  }
}
