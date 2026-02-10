"use server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";

export async function deleteConfession(confessionId: string) {
  try {
    const user = await requireAuth();

    // 1. Verify ownership before deleting
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      select: { receiverId: true, receiver: { select: { username: true } } }
    });

    if (!confession) return { error: "Message not found." };

    // Allow deletion if: user is the receiver OR user is ADMIN/OWNER
    const canDelete = confession.receiverId === user.id ||
                      user.role === "ADMIN" ||
                      user.role === "OWNER";

    if (!canDelete) {
      return { error: "Unauthorized: You can't delete messages sent to others." };
    }

    // 2. Delete
    await prisma.confession.delete({
      where: { id: confessionId },
    });

    // 3. Refresh caches - use path-based for per-user invalidation
    revalidatePath(`/u/${confession.receiver.username}`, "page");
    revalidateTag("user-confessions", {});
    return { success: true };
  } catch (error) {
    console.error("Delete confession error:", error);
    return { error: "Failed to delete message. Please try again." };
  }
}

export async function replyToConfession(confessionId: string, replyContent: string) {
  try {
    const user = await requireAuth();

    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      select: { receiverId: true, receiver: { select: { username: true } } }
    });

    if (!confession || confession.receiverId !== user.id) {
      return { error: "You can only reply to your own messages." };
    }

    await prisma.confession.update({
      where: { id: confessionId },
      data: {
        reply: replyContent,
        replyAt: new Date()
      }
    });

    // Use path-based for per-user cache invalidation
    revalidatePath(`/u/${confession.receiver.username}`, "page");
    revalidateTag("user-confessions", {});
    return { success: true };
  } catch (error) {
    console.error("Reply to confession error:", error);
    return { error: "Failed to reply. Please try again." };
  }
}

export async function togglePin(confessionId: string) {
  const user = await requireAuth();

  // Use interactive transaction to prevent race conditions
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the confession
      const confession = await tx.confession.findUnique({
        where: { id: confessionId },
        select: { receiverId: true, isPinned: true, receiver: { select: { username: true } } }
      });

      if (!confession) throw new Error("Message not found");

      // Allow pinning if: user is the receiver OR user is ADMIN/OWNER
      const canPin = confession.receiverId === user.id ||
                     user.role === "ADMIN" ||
                     user.role === "OWNER";

      if (!canPin) throw new Error("Unauthorized");

      // 2. If we are trying to PIN it (currently false), check limits within transaction
      // Skip limit check for ADMIN/OWNER (they can pin any number on other profiles)
      if (!confession.isPinned && user.role === "USER") {
        const count = await tx.confession.count({
          where: {
            receiverId: user.id,
            isPinned: true
          }
        });

        if (count >= 3) {
          throw new Error("You can only pin up to 3 messages.");
        }
      }

      // 3. Toggle
      const updated = await tx.confession.update({
        where: { id: confessionId },
        data: { isPinned: !confession.isPinned },
        select: { isPinned: true }
      });

      return { isPinned: updated.isPinned, username: confession.receiver.username };
    });

    // Use path-based for per-user cache invalidation
    revalidatePath(`/u/${result.username}`, "page");
    revalidateTag("user-confessions", {});
    return { success: true, isPinned: result.isPinned };

  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to toggle pin" };
  }
}

export async function fetchConfessions(userId: string, offset: number = 0) {
  const PAGE_SIZE = 12;

  try {
    const confessions = await prisma.confession.findMany({
      where: { receiverId: userId },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: PAGE_SIZE,
      skip: offset,
      include: {
        sender: { select: { username: true, image: true } },
        receiver: { select: { username: true } }
      },
    });

    return confessions;
  } catch (error) {
    console.error("Error fetching confessions:", error);
    // Return empty array to prevent infinite loop, but the error is logged
    // This is a reasonable fallback for infinite scroll - just stop loading
    return [];
  }
}

export async function editConfession(confessionId: string, newContent: string) {
  try {
    const user = await requireAuth();

    // 1. Verify ownership and check time window
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      select: { senderId: true, createdAt: true, content: true, receiver: { select: { username: true } } }
    });

    if (!confession) return { error: "Message not found." };

    if (confession.senderId !== user.id) {
      return { error: "Unauthorized: You can only edit your own sent messages." };
    }

    // 2. Check if within 5-minute window (300 seconds)
    const now = new Date();
    const timeDiff = (now.getTime() - confession.createdAt.getTime()) / 1000; // in seconds
    const EDIT_WINDOW_SECONDS = 5 * 60; // 5 minutes

    if (timeDiff > EDIT_WINDOW_SECONDS) {
      return { error: "Edit window has expired. Messages can only be edited within 5 minutes of sending." };
    }

    // 3. Update the confession
    await prisma.confession.update({
      where: { id: confessionId },
      data: {
        content: newContent,
        editedAt: now
      }
    });

    // 4. Refresh caches - use path-based for per-user cache invalidation
    revalidatePath(`/u/${confession.receiver.username}`, "page");
    revalidateTag("user-confessions", {});

    return { success: true };
  } catch (error) {
    console.error("Edit confession error:", error);
    return { error: "Failed to edit message. Please try again." };
  }
}
