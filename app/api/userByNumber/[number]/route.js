import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { isPhone, PUBLIC_USER_FIELDS } from "@/lib/validate";

// Used by the personal pay link (/pay/01XXXXXXXXX). Strict rate limit: this is
// the endpoint someone would use to try phone numbers one after another.
export async function GET(request, { params }) {
  const { number } = await params;
  if (!isPhone(number)) return NextResponse.json(null);

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
  const result = await userCollection.findOne(
    { Number: number },
    isAdmin ? {} : { projection: PUBLIC_USER_FIELDS },
  );
  return NextResponse.json(result);
}
