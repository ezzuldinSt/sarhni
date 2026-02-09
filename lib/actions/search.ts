"use server";
import { headers } from "next/headers";
import { createRateLimiter } from "@/lib/rate-limit";
import { getCachedSearchResults } from "@/lib/cache";

// 20 searches per minute — generous for typing, tight enough to block scraping
const checkSearchLimit = createRateLimiter(20, 60 * 1000);

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return { users: [], rateLimited: false };

  // Rate limit by IP (Vercel-compatible)
  const headerList = await headers();
  const ip = headerList.get("x-vercel-forwarded-for")
    || headerList.get("x-real-ip")
    || headerList.get("x-forwarded-for")?.split(",")[0].trim()
    || "unknown";

  if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
    const limit = checkSearchLimit(ip);
    if (!limit.success) return { users: [], rateLimited: true };
  }

  try {
    const users = await getCachedSearchResults(query);
    return { users, rateLimited: false };
  } catch (error) {
    console.error("Search error:", error);
    return { users: [], rateLimited: false };
  }
}
