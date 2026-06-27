import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/jwt";

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearAuthCookies(response);
}
