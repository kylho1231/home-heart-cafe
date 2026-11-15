import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "hhc_admin_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

interface RequestWithCookies {
  cookies: {
    get(name: string): { value: string } | undefined;
  };
}

interface ResponseWithCookies {
  cookies: {
    set(options: {
      name: string;
      value: string;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "lax" | "strict" | "none";
      path?: string;
      maxAge?: number;
    }): void;
  };
}

function getSecretKey(): string {
  return (
    process.env.SESSION_SECRET ||
    "hhc_default_secure_session_key_32_characters_long_min"
  );
}

export function getAdminPin(): string {
  return process.env.ADMIN_PIN || "1234";
}

interface AdminSessionPayload {
  sub: "admin";
  role: "store_admin";
  iat: number;
  exp: number;
}

/**
 * Signs an admin session payload using HMAC-SHA256
 */
export function signAdminToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    sub: "admin",
    role: "store_admin",
    iat: now,
    exp: now + SESSION_DURATION_SECONDS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", getSecretKey());
  hmac.update(payloadBase64);
  const signatureBase64 = hmac.digest("base64url");

  return `${payloadBase64}.${signatureBase64}`;
}

/**
 * Verifies an admin session token signature and expiration
 */
export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadBase64, providedSig] = parts;

  // Compute expected signature
  const hmac = crypto.createHmac("sha256", getSecretKey());
  hmac.update(payloadBase64);
  const expectedSig = hmac.digest("base64url");

  // Constant-time comparison prevents timing attacks
  const providedBuf = Buffer.from(providedSig);
  const expectedBuf = Buffer.from(expectedSig);
  if (providedBuf.length !== expectedBuf.length) return false;

  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return false;
  }

  try {
    const raw = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload = JSON.parse(raw) as AdminSessionPayload;

    if (payload.sub !== "admin" || payload.role !== "store_admin") {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return false; // Token expired
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies if the incoming request has a valid admin session cookie
 */
export function isAdminAuthenticated(request: RequestWithCookies): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  return verifyAdminToken(cookie?.value);
}

/**
 * Helper to securely compare entered PIN with environment variable
 */
export function verifyPin(enteredPin: string): boolean {
  const configuredPin = getAdminPin();
  const enteredBuf = Buffer.from(enteredPin.trim());
  const configuredBuf = Buffer.from(configuredPin.trim());

  if (enteredBuf.length !== configuredBuf.length) return false;
  return crypto.timingSafeEqual(enteredBuf, configuredBuf);
}

/**
 * Attach the session cookie to a response
 */
export function attachAdminSessionCookie(response: ResponseWithCookies, token: string): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Remove the session cookie from a response
 */
export function removeAdminSessionCookie(response: ResponseWithCookies): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
