import { NextResponse } from "next/server";

export async function GET() {
  const url = `https://api.mimsms.com/api/SmsSending/balanceCheck?userName=${process.env.API_USERNAME}&Apikey=${process.env.API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return NextResponse.json({ balance: data.responseResult });
}
