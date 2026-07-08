import { NextResponse } from "next/server";

export async function POST(request) {
  const { number, message } = await request.json();
  const payload = {
    UserName: `${process.env.API_USERNAME}`,
    Apikey: `${process.env.API_KEY}`,
    MobileNumber: `88${number}`,
    CampaignId: "Islampur Jame Masjid",
    SenderName: "8809601004618",
    TransactionType: "T",
    Message: message,
  };
  try {
    const response = await fetch(
      "https://api.mimsms.com/api/SmsSending/SMS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();

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
      { status: 500 }
    );
  }
}
