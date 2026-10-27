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
  const { bkashRequestCollection } = await getCollections();

  const claim = await bkashRequestCollection.findOne({ _id: new ObjectId(id) });
  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }
  if (claim.status !== "pending") {
    return NextResponse.json(
      { error: `Claim already ${claim.status}` },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => ({}));

  const result = await bkashRequestCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "rejected",
        rejectReason: body.reason || null,
        reviewedAt: new Date().toISOString(),
      },
    }
  );

  return NextResponse.json(result);
}
