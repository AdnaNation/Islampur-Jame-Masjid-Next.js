import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { bad, isId, PUBLIC_USER_FIELDS, toPublicUser } from "@/lib/validate";

export async function GET(request, { params }) {
  const { id } = await params;
  if (!isId(id)) return bad("ভুল আইডি");

  const session = await getSession(request);
  const isAdmin = session?.admin === true;
  if (!isAdmin) {
    const limited = await rateLimit(request, {
      name: "user-id",
      limit: 40,
      windowSec: 60,
    });
    if (limited) return limited;
  }

  const { userCollection } = await getCollections();

  if (isAdmin) {
    const full = await userCollection.findOne({ _id: new ObjectId(id) });
    return NextResponse.json(full);
  }

  // Number is read only to compute hasNumber / maskedNumber, then removed
  const doc = await userCollection.findOne(
    { _id: new ObjectId(id) },
    { projection: { ...PUBLIC_USER_FIELDS, Number: 1 } },
  );
  return NextResponse.json(toPublicUser(doc));
}
