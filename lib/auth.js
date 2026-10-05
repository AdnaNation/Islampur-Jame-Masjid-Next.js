import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
export function verifyToken(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "unauthorized access" },
      { status: 401 },
    );
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return NextResponse.json(
      { message: "unauthorized access" },
      { status: 401 },
    );
  }
}
