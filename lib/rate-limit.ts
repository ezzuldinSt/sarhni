type RateLimitRecord = {
  count: number;
  resetTime: number;
};

// Global map to store IP hits.
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

// Factory for creating separate rate limiters with custom limits
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
