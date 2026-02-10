"use server";
import { createRateLimiter, getClientIP, checkRateLimitByUser } from "@/lib/rate-limit";
import { getCachedSearchResults } from "@/lib/cache";
import { getCachedSession } from "@/lib/auth-cached";

// 20 searches per minute — generous for typing, tight enough to block scraping
const checkSearchLimit = createRateLimiter(20, 60 * 1000);

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return { users: [], rateLimited: false };

  // Priority: Account-based (for authenticated users) > IP-based (for anonymous)
  const session = await getCachedSession();

  // Try account-based rate limiting first for authenticated users
  if (session?.user?.id) {
    const userLimit = checkRateLimitByUser(session.user.id, 20, 60 * 1000);
    if (!userLimit.success) return { users: [], rateLimited: true };
  } else {
    // Fall back to IP-based rate limiting for anonymous users
    const ip = await getClientIP();
    if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
      const limit = checkSearchLimit(ip);
      if (!limit.success) return { users: [], rateLimited: true };
    }
  }

  try {
    const users = await getCachedSearchResults(query);
    return { users, rateLimited: false };
  } catch (error) {
    console.error("Search error:", error);
    return { users: [], rateLimited: false };
  }
}
