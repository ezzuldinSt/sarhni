"use server";
import { prisma } from "@/lib/prisma";

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return [];

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive', // Search "zhr" finds "Zhr", "ZHR", etc.
        },
      },
      select: {
        username: true,
        image: true,
      },
      take: 5, // Limit to top 5 matches
    });
    return users;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

