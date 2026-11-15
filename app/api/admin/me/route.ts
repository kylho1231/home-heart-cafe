import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authenticated = isAdminAuthenticated(request);
  return NextResponse.json({
    success: true,
    authenticated,
  });
}
