import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

// Names (only) of the members of one home - the public /pay page uses this
// for its "pick your name" list. "home" means "everyone" (payment history filter).
export async function GET(request, { params }) {
  const { home } = await params;
  const session = await getSession(request);
  const isAdmin = session?.admin === true;

  if (!isAdmin) {
    if (home === "home" && process.env.PUBLIC_MEMBER_BOARD === "false")
      return NextResponse.json(
        { message: "এডমিন হিসেবে আবার সাইন ইন করুন" },
        { status: 401 },
      );
    const limited = await rateLimit(request, {
      name: "users-name",
      limit: 60,
      windowSec: 60,
    });
    if (limited) return limited;
  }

  const { userCollection } = await getCollections();
  const query = home === "home" ? {} : { HomeName: String(home) };
  const result = await userCollection
    .find(query, { projection: { NameBn: 1 } })
    .toArray();
  return NextResponse.json(result);
}
