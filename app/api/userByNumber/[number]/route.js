import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import {
  isContactNumber,
  PUBLIC_USER_FIELDS,
  toPublicUser,
} from "@/lib/validate";

export async function GET(request, { params }) {
  const { number } = await params;
  if (!isContactNumber(number)) return NextResponse.json(null);

  const session = await getSession(request);
  const isAdmin = session?.admin === true;
  if (!isAdmin) {
    const limited = await rateLimit(request, {
      name: "user-by-number",
      limit: 15,
      windowSec: 60,
    });
    if (limited) return limited;
  }

  const { userCollection } = await getCollections();

  if (isAdmin) {
    const full = await userCollection.findOne({ Number: number });
    return NextResponse.json(full);
  }

  const doc = await userCollection.findOne(
    { Number: number },
    { projection: { ...PUBLIC_USER_FIELDS, Number: 1 } },
  );
  return NextResponse.json(toPublicUser(doc));
}
