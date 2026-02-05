"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
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

  // 3. Refresh the dashboard
  revalidatePath("/dashboard");
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

  revalidatePath("/dashboard");
  revalidatePath(`/u/${session.user.name}`); // Update public profile too
  return { success: true };
}

export async function togglePin(confessionId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // 1. Get the confession
  const confession = await prisma.confession.findUnique({
    where: { id: confessionId },
    select: { receiverId: true, isPinned: true }
  });

  if (!confession) return { error: "Message not found" };
  if (confession.receiverId !== session.user.id) return { error: "Unauthorized" };

  // 2. If we are trying to PIN it (currently false), check limits
  if (!confession.isPinned) {
    const count = await prisma.confession.count({
      where: {
        receiverId: session.user.id,
        isPinned: true
      }
    });

    if (count >= 3) {
      return { error: "You can only pin up to 3 messages." };
    }
  }

  // 3. Toggle
  await prisma.confession.update({
    where: { id: confessionId },
    data: { isPinned: !confession.isPinned }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/u/${session.user.name}`);
  return { success: true, isPinned: !confession.isPinned };
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
    return [];
  }
}
