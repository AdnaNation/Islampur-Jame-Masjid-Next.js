import { NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

export async function POST(request) {
  const { number, message } = await request.json();
  try {
    const data = await sendSms(number, message);
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
