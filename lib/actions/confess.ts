"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { checkRateLimit, getClientIP, checkRateLimitByUser } from "@/lib/rate-limit";
import { getCachedSession } from "@/lib/auth-cached";
import { broadcastNewConfession } from "@/lib/events";

const schema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(500, "Message is too long"),
  receiverId: z.string(),
  usernamePath: z.string(),
  isAnonymous: z.string().transform((val) => val === "true"),
});

export async function sendConfession(formData: FormData) {
  // 1. Validate Form Data
  const validatedFields = schema.safeParse({
    content: formData.get("content"),
    receiverId: formData.get("receiverId"),
    usernamePath: formData.get("usernamePath"),
    isAnonymous: formData.get("isAnonymous"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }

  const { content, receiverId, usernamePath, isAnonymous } = validatedFields.data;

  // 2. RATE LIMIT CHECK
  // Priority: Account-based (for authenticated users) > IP-based (for anonymous)
  const session = await getCachedSession();

  // Try account-based rate limiting first for authenticated users
  if (session?.user?.id) {
    const userLimit = checkRateLimitByUser(session.user.id);
    if (!userLimit.success) {
      const timeLeft = Math.ceil((userLimit.resetAt! - Date.now()) / 1000);
      return { error: `You are doing that too much. Wait ${timeLeft}s.` };
    }
  } else {
    // Fall back to IP-based rate limiting for anonymous users
    const ip = await getClientIP();
    // Only rate limit if we can identify the IP and it's not localhost
    if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
      const limit = checkRateLimit(ip);
      if (!limit.success) {
        const timeLeft = Math.ceil((limit.resetAt! - Date.now()) / 1000);
        return { error: `You are doing that too much. Wait ${timeLeft}s.` };
      }
    }
  }

  // 3. Proceed to Save
  try {
    const receiver = await prisma.user.findUnique({
       where: { id: receiverId },
       select: { id: true, username: true }
    });

    if (!receiver) return { error: "User not found." };

    const session = await getCachedSession();
    const realSenderId = (!isAnonymous && session?.user?.id) ? session.user.id : null;

    // Create confession and include sender data for real-time broadcast
    const newConfession = await prisma.confession.create({
      data: {
        content,
        receiverId,
        isAnonymous,
        senderId: realSenderId,
      },
      include: {
        sender: { select: { username: true, image: true } },
        receiver: { select: { username: true } },
      },
    });

    // REAL-TIME: Broadcast to recipient's connected clients
    // This triggers SSE push to all viewers of the recipient's profile
    broadcastNewConfession(newConfession, receiverId);

    // OPTIMIZATION: Use path-based revalidation for per-user cache invalidation
    // Only the receiver's profile page needs to be refreshed
    revalidatePath(`/u/${receiver.username}`, "page");

    return { success: true };
  } catch (error) {
    console.error("Confession Error:", error);

    // Provide specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return { error: "Something went wrong. Please try again." };
      }
      if (error.message.includes("Foreign key constraint")) {
        return { error: "Unable to send message. User may have been deleted." };
      }
      if (error.message.includes("database") || error.message.includes("connection")) {
        return { error: "Service temporarily unavailable. Please try again." };
      }
    }

    return { error: "Failed to send confession. Please try again later." };
  }
}
