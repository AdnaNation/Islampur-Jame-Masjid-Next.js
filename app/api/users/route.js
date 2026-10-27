import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { escapeRegex, PUBLIC_USER_FIELDS } from "@/lib/validate";

// Members list.
//  - admin     -> full records (phone numbers etc.)
//  - everyone  -> only name, home, fee rate and paid/unpaid status (no phone number)
// Set PUBLIC_MEMBER_BOARD=false to make this admin-only.
export async function GET(request) {
  const session = await getSession(request);
  const isAdmin = session?.admin === true;

  if (!isAdmin) {
    if (process.env.PUBLIC_MEMBER_BOARD === "false")
      return NextResponse.json(
        { message: "এডমিন হিসেবে আবার সাইন ইন করুন" },
        { status: 401 },
      );
    const limited = await rateLimit(request, {
      name: "users",
      limit: 60,
      windowSec: 60,
    });
    if (limited) return limited;
  }

  const sp = new URL(request.url).searchParams;
  const { userCollection } = await getCollections();
  const query = {
    Name: { $regex: escapeRegex(sp.get("search")), $options: "i" },
    NameBn: { $regex: escapeRegex(sp.get("searchBn")), $options: "i" },
    HomeName: { $regex: escapeRegex(sp.get("HomeName")) },
  };
  const result = await userCollection
    .find(query, isAdmin ? {} : { projection: PUBLIC_USER_FIELDS })
    .limit(5000)
    .toArray();
  return NextResponse.json(result);
}
