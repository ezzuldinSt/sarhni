"use server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { createRateLimiter } from "@/lib/rate-limit";

// Rate limiter for registration: 3 attempts per hour per IP
const checkRegistrationRateLimit = createRateLimiter(3, 60 * 60 * 1000);

const registerSchema = z.object({
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6),
});

export async function registerUser(prevState: any, formData: FormData) {
  // Get IP address for rate limiting
  const headerList = await headers();
  let ip = headerList.get("x-real-ip") || "unknown";

  // Check rate limit
  const rateLimit = checkRegistrationRateLimit(ip);
  if (!rateLimit.success) {
    const resetDate = new Date(rateLimit.resetAt);
    return { error: `Too many registration attempts. Try again after ${resetDate.toLocaleTimeString()}.` };
  }

  const data = Object.fromEntries(formData.entries());
  const validated = registerSchema.safeParse(data);

  if (!validated.success) return { error: validated.error.errors[0].message };

  const { username, password } = validated.data;
  const normalizedUsername = username.toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);

  const ownerUsername = process.env.OWNER_USERNAME?.toLowerCase();
  const role = ownerUsername && normalizedUsername === ownerUsername ? "OWNER" : "USER";

  try {
    await prisma.user.create({
      data: {
        username: normalizedUsername,
        password: hashedPassword,
        role: role,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return { error: "Username already taken." };
    }
    return { error: "Registration failed." };
  }

  redirect("/login?registered=true");
}

