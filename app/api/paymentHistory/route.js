import { NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { escapeRegex, PUBLIC_PAYMENT_FIELDS } from "@/lib/validate";

// Payment history.
//  - admin    -> full records (TrxID, sender number, member id, reverted ones)
//  - everyone -> name, home, amount, type, month, date, method (no TrxID / phone)
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
      name: "payment-history",
      limit: 120, // this page refreshes itself every few seconds
      windowSec: 60,
    });
    if (limited) return limited;
  }

  const sp = new URL(request.url).searchParams;
  const { paymentCollection } = await getCollections();
  // only admins may look at cancelled payments
  const showReverted = isAdmin && sp.get("reverted") === "true";
  const revertedFilter = showReverted ? true : { $ne: true };
  const home = sp.get("home") ?? "";

  const query =
    home === "home"
      ? { reverted: revertedFilter }
      : {
          name: { $regex: escapeRegex(sp.get("name")) },
          home: { $regex: escapeRegex(home) },
          reverted: revertedFilter,
        };

  const result = await paymentCollection
    .find(query, isAdmin ? {} : { projection: PUBLIC_PAYMENT_FIELDS })
    .limit(10000)
    .toArray();
  return NextResponse.json(result);
}
