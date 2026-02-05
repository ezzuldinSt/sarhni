"use server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { createRateLimiter } from "@/lib/rate-limit";

// 20 searches per minute — generous for typing, tight enough to block scraping
const checkSearchLimit = createRateLimiter(20, 60 * 1000);

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return [];

  // Rate limit by IP
  const headerList = await headers();
  const ip = headerList.get("x-real-ip")
    || headerList.get("x-forwarded-for")?.split(",")[0].trim()
    || "unknown";

  if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
    const limit = checkSearchLimit(ip);
    if (!limit.success) return [];
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
        isBanned: false,
      },
      select: {
        username: true,
        image: true,
      },
      take: 5,
    });
    return users;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

