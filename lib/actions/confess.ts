"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

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
  const headerList = await headers();

  // Vercel-compatible IP detection
  // Priority order:
  // 1. x-vercel-forwarded-for (Vercel's trusted header)
  // 2. x-real-ip (Docker/nginx/proxy standard)
  // 3. x-forwarded-for (standard proxy header, take first IP)
  let ip = headerList.get("x-vercel-forwarded-for") ||
           headerList.get("x-real-ip");

  if (!ip) {
      const forwarded = headerList.get("x-forwarded-for");
      if (forwarded) {
          // Take the first IP from the chain (original client)
          ip = forwarded.split(",")[0].trim();
      }
  }

  // Fallback if no headers found (e.g., local dev)
  ip = ip || "unknown";

  // Only rate limit if we can identify the IP and it's not localhost
  if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
    const limit = checkRateLimit(ip);
    if (!limit.success) {
      const timeLeft = Math.ceil((limit.resetAt! - Date.now()) / 1000);
      return { error: `You are doing that too much. Wait ${timeLeft}s.` };
    }
  }

  // 3. Proceed to Save
  try {
    const receiver = await prisma.user.findUnique({
       where: { id: receiverId }
    });
    
    if (!receiver) return { error: "User not found." };

    const session = await auth();
    const realSenderId = (!isAnonymous && session?.user?.id) ? session.user.id : null;

    await prisma.confession.create({
      data: {
        content,
        receiverId,
        isAnonymous,
        senderId: realSenderId, 
      },
    });

    // OPTIMIZATION: Use only tag-based revalidation
    // revalidateTag invalidates all cached data with "user-profiles" tag
    // Path revalidations are redundant for dynamic pages (not ISR)
    revalidateTag("user-profiles", {});

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
