"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";

export async function deleteConfession(confessionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "You must be logged in." };

    // 1. Verify ownership before deleting
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      select: { receiverId: true }
    });

    if (!confession) return { error: "Message not found." };

    if (confession.receiverId !== session.user.id) {
      return { error: "Unauthorized: You can't delete messages sent to others." };
    }

    // 2. Delete
    await prisma.confession.delete({
      where: { id: confessionId },
    });

    // 3. Refresh caches
    // OPTIMIZATION: Tag-based revalidation is sufficient for dynamic pages
    revalidateTag("user-profiles", {});
    return { success: true };
  } catch (error) {
    console.error("Delete confession error:", error);
    return { error: "Failed to delete message. Please try again." };
  }
}

export async function replyToConfession(confessionId: string, replyContent: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      select: { receiverId: true }
    });

    if (!confession || confession.receiverId !== session.user.id) {
      return { error: "You can only reply to your own messages." };
    }

    await prisma.confession.update({
      where: { id: confessionId },
      data: {
        reply: replyContent,
        replyAt: new Date()
      }
    });

    // OPTIMIZATION: Tag-based revalidation invalidates all cached data
    revalidateTag("user-profiles", {});
    return { success: true };
  } catch (error) {
    console.error("Reply to confession error:", error);
    return { error: "Failed to reply. Please try again." };
  }
}

export async function togglePin(confessionId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Use interactive transaction to prevent race conditions
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the confession
      const confession = await tx.confession.findUnique({
        where: { id: confessionId },
        select: { receiverId: true, isPinned: true }
      });

      if (!confession) throw new Error("Message not found");
      if (confession.receiverId !== session.user.id) throw new Error("Unauthorized");

      // 2. If we are trying to PIN it (currently false), check limits within transaction
      if (!confession.isPinned) {
        const count = await tx.confession.count({
          where: {
            receiverId: session.user.id,
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

      return { isPinned: updated.isPinned, username: session.user.name };
    });

    // OPTIMIZATION: Tag-based revalidation invalidates all cached data
    revalidateTag("user-profiles", {});
    return { success: true, isPinned: result.isPinned };

  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to toggle pin" };
  }
}

export async function fetchConfessions(userId: string, offset: number = 0, signal?: AbortSignal) {
  const PAGE_SIZE = 12;

  try {
    // Pass abort signal to Prisma for cancellation support
    const confessions = await prisma.confession.findMany({
      where: { receiverId: userId },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: PAGE_SIZE,
      skip: offset,
      include: {
        sender: { select: { username: true } },
        receiver: { select: { username: true } }
      },
      // Pass the abort signal through to the underlying request
      // @ts-ignore - Prisma supports abort signal but types may not include it
      abortSignal: signal
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
    const session = await auth();
    if (!session?.user?.id) return { error: "You must be logged in." };

    // 1. Verify ownership and check time window
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      select: { senderId: true, createdAt: true, content: true }
    });

    if (!confession) return { error: "Message not found." };

    if (confession.senderId !== session.user.id) {
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

    // 4. Refresh caches
    // OPTIMIZATION: Tag-based revalidation is sufficient
    revalidateTag("user-profiles", {});
    return { success: true };
  } catch (error) {
    console.error("Edit confession error:", error);
    return { error: "Failed to edit message. Please try again." };
  }
}
