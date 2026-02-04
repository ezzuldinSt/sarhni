"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers"; // <--- Import Headers
import { checkRateLimit } from "@/lib/rate-limit"; // <--- Import helper

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
  // Get IP: checks 'x-forwarded-for' (if behind Nginx/Cloudflare) or fallback to 'unknown'
  const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "unknown";

  if (ip !== "unknown") {
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

    // Handle sender logic if not anonymous
    let senderId = null;
    
    // Note: If you have auth logic, you can add it here to populate senderId

    await prisma.confession.create({
      data: {
        content,
        receiverId,
        isAnonymous,
        senderId, 
      },
    });

    revalidatePath(`/u/${usernamePath}`);
    revalidatePath(`/dashboard`);
    
    return { success: true };
  } catch (error) {
    console.error("Confession error:", error);
    return { error: "Something went wrong sending your message." };
  }
}
