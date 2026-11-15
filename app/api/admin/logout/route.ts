import { NextResponse } from "next/server";
import { removeAdminSessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Admin session logged out successfully.",
  });

  removeAdminSessionCookie(response);
  return response;
}
