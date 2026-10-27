import { NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";
import { requireAdmin } from "@/lib/auth";
import { bad, isPhone, str } from "@/lib/validate";

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const number = body?.number;
  const message = str(body?.message, 1000);
  if (!isPhone(number) || !message) return bad("নাম্বার বা মেসেজ সঠিক নয়");

  try {
    const data = await sendSms(number, message);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("sms failed:", error?.message);
    return NextResponse.json(
      { success: false, error: "মেসেজ পাঠানো যায়নি" },
      { status: 500 },
    );
  }
}
