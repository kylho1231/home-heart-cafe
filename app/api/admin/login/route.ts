import { NextRequest, NextResponse } from "next/server";
import { verifyPin, signAdminToken, attachAdminSessionCookie } from "@/lib/auth";
import {
  getClientIp,
  checkLoginLockout,
  recordLoginFailure,
  resetLoginLockout,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // 1. Check if IP is currently locked out
    const lockout = checkLoginLockout(ip);
    if (lockout.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Locked out for ${lockout.remainingMinutes} more minute(s).`,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const pin = typeof body?.pin === "string" ? body.pin.trim() : "";

    if (!pin) {
      return NextResponse.json(
        { success: false, error: "PIN is required." },
        { status: 400 },
      );
    }

    // 2. Verify entered PIN against server environment variable
    const isValid = verifyPin(pin);

    if (!isValid) {
      const { attemptsLeft } = recordLoginFailure(ip);
      const errorMsg =
        attemptsLeft > 0
          ? `Incorrect PIN. ${attemptsLeft} attempt(s) remaining before lockout.`
          : "Incorrect PIN. Maximum attempts exceeded. You are locked out for 15 minutes.";

      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 401 },
      );
    }

    // 3. Reset failure count on successful authentication
    resetLoginLockout(ip);

    // 4. Generate signed 8-hour token and attach httpOnly secure cookie
    const token = signAdminToken();
    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful.",
    });

    attachAdminSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("POST /api/admin/login error:", error);
    return NextResponse.json(
      { success: false, error: "Server error during login." },
      { status: 500 },
    );
  }
}
