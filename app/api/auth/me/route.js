import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// "Who am I?" - replaces the old /verifyAdmin/:number and /verifyModerator/:number,
// which trusted a phone number typed into the URL.
export async function GET(request) {
  const s = await getSession(request);
  return NextResponse.json({
    signedIn: !!s,
    number: s?.number ?? null,
    admin: s?.admin === true,
    moderator: s?.moderator === true,
  });
}
