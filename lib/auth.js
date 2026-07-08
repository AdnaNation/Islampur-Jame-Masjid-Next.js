import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

/**
 * Verifies the Authorization: Bearer <token> header on a request.
 * Mirrors the `verifyToken` middleware from the original Express server.
 * (Note: in the original server this middleware was defined but never
 * attached to any route — carried over here for parity / future use.)
 *
 * Usage inside a route handler:
 *   const decoded = verifyToken(request);
 *   if (decoded instanceof NextResponse) return decoded; // unauthorized
 */
export function verifyToken(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ message: "unauthorized access" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return NextResponse.json({ message: "unauthorized access" }, { status: 401 });
  }
}
