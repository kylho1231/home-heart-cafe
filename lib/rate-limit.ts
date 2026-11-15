interface RequestWithHeaders {
  headers: {
    get(name: string): string | null;
  };
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Stores IP rate limit records in memory with automated cleanup
const limitStore = new Map<string, RateLimitRecord>();

// Clean up expired keys periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of limitStore.entries()) {
    if (record.resetAt <= now) {
      limitStore.delete(key);
    }
  }
}

/**
 * Extracts a client IP from NextRequest headers
 */
export function getClientIp(request: RequestWithHeaders): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Checks and increments rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpired();
  const now = Date.now();
  const existing = limitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    limitStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetTime: existing.resetAt,
  };
}

/**
 * Dedicated helper for admin login failure tracking & lockout:
 * Max 5 failed attempts per IP per 15 minutes
 */
const LOGIN_LOCKOUT_MAX_FAILURES = 5;
const LOGIN_LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

export function checkLoginLockout(ip: string): { isLocked: boolean; remainingMinutes: number } {
  cleanupExpired();
  const now = Date.now();
  const key = `login_fail:${ip}`;
  const existing = limitStore.get(key);

  if (existing && existing.resetAt > now && existing.count >= LOGIN_LOCKOUT_MAX_FAILURES) {
    const remainingMinutes = Math.ceil((existing.resetAt - now) / 60000);
    return { isLocked: true, remainingMinutes };
  }

  return { isLocked: false, remainingMinutes: 0 };
}

export function recordLoginFailure(ip: string): { attemptsLeft: number } {
  cleanupExpired();
  const now = Date.now();
  const key = `login_fail:${ip}`;
  const existing = limitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    limitStore.set(key, { count: 1, resetAt: now + LOGIN_LOCKOUT_WINDOW_MS });
    return { attemptsLeft: LOGIN_LOCKOUT_MAX_FAILURES - 1 };
  }

  existing.count += 1;
  const attemptsLeft = Math.max(0, LOGIN_LOCKOUT_MAX_FAILURES - existing.count);
  return { attemptsLeft };
}

export function resetLoginLockout(ip: string): void {
  limitStore.delete(`login_fail:${ip}`);
}
