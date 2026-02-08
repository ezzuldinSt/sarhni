import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// --- Cache Tag Constants ---
export const CacheTags = {
  userProfile: (username: string) => `user-${username}`,
  userConfessions: (userId: string) => `confessions-${userId}`,
  adminUsers: "admin-users",
  search: "user-search",
} as const;

// --- Cached Queries ---

// User header data (no confessions) — fast, long cache
export const getCachedUserHeader = unstable_cache(
  async (username: string) => {
    return prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, bio: true, image: true },
    });
  },
  ["user-header"],
  { revalidate: 120, tags: ["user-profiles"] }
);

// User confessions — separate query for Suspense streaming
export const getCachedUserConfessions = unstable_cache(
  async (userId: string) => {
    return prisma.confession.findMany({
      where: { receiverId: userId },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
      take: 10,
      include: {
        sender: { select: { username: true } },
        receiver: { select: { username: true } },
      },
    });
  },
  ["user-confessions"],
  { revalidate: 60, tags: ["user-profiles"] }
);

export const getCachedUserMeta = unstable_cache(
  async (username: string) => {
    return prisma.user.findUnique({
      where: { username },
      select: { bio: true },
    });
  },
  ["user-meta"],
  { revalidate: 300, tags: ["user-profiles"] }
);

// OPTIMIZATION: Support pagination for admin users to reduce payload size
export const getCachedAdminUsers = unstable_cache(
  async (query: string = "", limit: number = 50, offset: number = 0) => {
    const [users, count] = await Promise.all([
      prisma.user.findMany({
        where: {
          username: { contains: query, mode: "insensitive" },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: { id: true, username: true, role: true, isBanned: true, createdAt: true },
      }),
      prisma.user.count({
        where: {
          username: { contains: query, mode: "insensitive" },
        },
      })
    ]);

    return { users, total: count };
  },
  ["admin-users"],
  { revalidate: 30, tags: ["admin-users"] }
);

export const getCachedSearchResults = unstable_cache(
  async (query: string) => {
    // Sanitize query to prevent cache key issues
    const sanitizedQuery = query.trim().toLowerCase();

    if (!sanitizedQuery || sanitizedQuery.length < 2) {
      return [];
    }

    try {
      const results = await prisma.user.findMany({
        where: {
          username: { contains: sanitizedQuery, mode: "insensitive" },
          isBanned: false,
        },
        select: { username: true, image: true },
        take: 5,
        orderBy: { username: 'asc' }, // Consistent ordering for better cache hits
      });

      return results;
    } catch (error) {
      console.error(`Search cache error for query "${sanitizedQuery}":`, error);
      return [];
    }
  },
  ["user-search"], // Next.js automatically includes query in cache key
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ["user-search"], // Invalidate when users update profiles
  }
);
