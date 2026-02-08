type RateLimitRecord = {
  count: number;
  resetTime: number;
};

/**
 * Vercel-compatible rate limiting implementation
 *
 * IMPORTANT: In Vercel serverless functions, in-memory rate limiting
 * has limitations because each function invocation is stateless.
 * The rate limit map will reset on each cold start.
 *
 * For production use on Vercel, consider:
 * 1. Vercel Firewall (Pro plan+) - https://vercel.com/docs/security/firewall
 * 2. Upstash Redis - https://upstash.com
 * 3. Database-backed rate limiting with Prisma
 *
 * This implementation provides basic protection during
 * a single serverless function execution and works well
 * for development and low-traffic scenarios.
 *
 * @see {@link https://vercel.com/docs/security/firewall}
 * @see {@link https://vercel.com/kb/guide/how-to-use-redis-with-vercel}
 */

// Global map to store IP hits (resets on each cold start in serverless)
const rateLimitMap = new Map<string, RateLimitRecord>();

// CONFIGURATION
const WINDOW_SIZE = 60 * 1000; // 1 minute (in milliseconds)
const MAX_REQUESTS = 5;        // Max 5 messages per minute
const CLEANUP_INTERVAL = 60 * 1000; // Run cleanup at most once per minute

let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [ip, record] of rateLimitMap) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

/**
 * Check if a request from the given IP is within rate limits
 *
 * @param ip - The client IP address
 * @returns Object with success status and optional reset time
 */
export function checkRateLimit(ip: string) {
  cleanupExpired();

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // 1. New visitor? Track them.
  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_SIZE });
    return { success: true };
  }

  // 2. Has the window expired? Reset them.
  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_SIZE });
    return { success: true };
  }

  // 3. Have they exceeded the limit? Block them.
  if (record.count >= MAX_REQUESTS) {
    return {
      success: false,
      resetAt: record.resetTime
    };
  }

  // 4. Increment count
  record.count += 1;
  return { success: true };
}

/**
 * Factory for creating separate rate limiters with custom limits
 *
 * @param maxRequests - Maximum requests allowed within the window
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit check function
 *
 * @example
 * ```ts
 * const checkSearchLimit = createRateLimiter(20, 60 * 1000); // 20 requests per minute
 * const result = checkSearchLimit(ip);
 * ```
 */
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const map = new Map<string, RateLimitRecord>();
  let lastClean = Date.now();

  return function check(ip: string) {
    const now = Date.now();
    if (now - lastClean > windowMs) {
      lastClean = now;
      for (const [key, rec] of map) {
        if (now > rec.resetTime) map.delete(key);
      }
    }

    const record = map.get(ip);

    if (!record || now > record.resetTime) {
      map.set(ip, { count: 1, resetTime: now + windowMs });
      return { success: true, resetAt: 0 };
    }

    if (record.count >= maxRequests) {
      return { success: false, resetAt: record.resetTime };
    }

    record.count += 1;
    return { success: true, resetAt: 0 };
  };
}

/**
 * Get current rate limit status for an IP (useful for displaying limits to users)
 *
 * @param ip - The client IP address
 * @returns Object with remaining requests and reset time
 */
export function getRateLimitStatus(ip: string) {
  const record = rateLimitMap.get(ip);
  const now = Date.now();

  if (!record || now > record.resetTime) {
    return {
      remaining: MAX_REQUESTS,
      resetAt: now + WINDOW_SIZE
    };
  }

  return {
    remaining: Math.max(0, MAX_REQUESTS - record.count),
    resetAt: record.resetTime
  };
}
