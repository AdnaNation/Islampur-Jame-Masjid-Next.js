import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { bad, isId, PUBLIC_USER_FIELDS } from "@/lib/validate";

// One member. The public /pay page needs the dues; only admins get the phone number.
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
  const result = await userCollection.findOne(
    { _id: new ObjectId(id) },
    isAdmin ? {} : { projection: PUBLIC_USER_FIELDS },
  );
  return NextResponse.json(result);
}
