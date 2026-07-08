import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request) {
  const user = await request.json();
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "24h",
  });
  return NextResponse.json({ token });
}
