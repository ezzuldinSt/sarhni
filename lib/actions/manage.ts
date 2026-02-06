"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";

export async function deleteConfession(confessionId: string) {
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
  revalidateTag("user-profiles", "max");
  revalidatePath("/dashboard", "page");
  return { success: true };
}

export async function replyToConfession(confessionId: string, replyContent: string) {
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

  revalidateTag("user-profiles", "max");
  revalidatePath("/dashboard", "page");
  revalidatePath(`/u/${session.user.name}`, "page");
  return { success: true };
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

    revalidateTag("user-profiles", "max");
    revalidatePath("/dashboard", "page");
    revalidatePath(`/u/${result.username}`, "page");
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
        sender: { select: { username: true } },
        receiver: { select: { username: true } }
      }
    });

    return confessions;
  } catch (error) {
    console.error("Error fetching confessions:", error);
    // Return empty array to prevent infinite loop, but the error is logged
    // This is a reasonable fallback for infinite scroll - just stop loading
    return [];
  }
}
