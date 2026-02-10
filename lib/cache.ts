import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// ============================================================================
// CACHE TAG CONSTANTS
// ============================================================================

// Static cache tags used for global invalidation
// For per-user invalidation, we use revalidatePath() in Server Actions
export const CacheTags = {
  adminUsers: "admin-users",
  search: "user-search",
  // Note: Per-user caches use revalidatePath() instead of tags
  // because unstable_cache doesn't support dynamic tag generation
} as const;

// ============================================================================
// CACHED QUERIES
// ============================================================================

// User header data (no confessions) — fast, long cache
// Cache automatically differentiates by username argument
// Invalidation: Use revalidatePath(`/u/${username}`, "page") in Server Actions
export const getCachedUserHeader = unstable_cache(
  async (username: string) => {
    return prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, bio: true, image: true },
    });
  },
  ["user-header"],
  {
    revalidate: 120,
    // Using a global tag - invalidated when any user profile changes
    // For per-user invalidation, Server Actions use revalidatePath()
    tags: ["user-profiles"]
  }
);

// User confessions — separate query for Suspense streaming
// Cache automatically differentiates by userId argument
// Invalidation: Use revalidatePath(`/u/${username}`, "page") in Server Actions
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
        sender: { select: { username: true, image: true } },
        receiver: { select: { username: true } },
      },
    });
  },
  ["user-confessions"],
  {
    revalidate: 60,
    // Using a global tag - invalidated when confessions change
    // For per-user invalidation, Server Actions use revalidatePath()
    tags: ["user-confessions"]
  }
);

// User metadata for SEO/metadata generation
// Cache automatically differentiates by username argument
// Invalidation: Use revalidatePath(`/u/${username}`, "page") in Server Actions
export const getCachedUserMeta = unstable_cache(
  async (username: string) => {
    return prisma.user.findUnique({
      where: { username },
      select: { bio: true },
    });
  },
  ["user-meta"],
  {
    revalidate: 300,
    // Using a global tag - invalidated when user metadata changes
    // For per-user invalidation, Server Actions use revalidatePath()
    tags: ["user-profiles"]
  }
);

// ============================================================================
// ADMIN CACHED QUERIES
// ============================================================================

// OPTIMIZATION: Support pagination for admin users to reduce payload size
// Global tag is appropriate here - admin changes affect all admin views
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

// ============================================================================
// SEARCH CACHED QUERIES
// ============================================================================

// Global search results cache
// Global tag is appropriate here - profile changes should refresh search results
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
