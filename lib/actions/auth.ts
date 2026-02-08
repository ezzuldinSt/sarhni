"use server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { createRateLimiter } from "@/lib/rate-limit";
import { signIn } from "@/lib/auth";

// Rate limiter for registration: 3 attempts per hour per IP
const checkRegistrationRateLimit = createRateLimiter(3, 60 * 60 * 1000);

// Rate limiter for login: 5 attempts per 15 minutes per IP (more restrictive for security)
const checkLoginRateLimit = createRateLimiter(5, 15 * 60 * 1000);

const registerSchema = z.object({
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6),
});

export async function registerUser(prevState: any, formData: FormData) {
  // Get IP address for rate limiting (Vercel-compatible)
  const headerList = await headers();
  let ip = headerList.get("x-vercel-forwarded-for") ||  // Vercel's trusted header
           headerList.get("x-real-ip") ||                  // Docker/nginx standard
           "unknown";

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

  console.log(`[Registration] Attempt: username=${normalizedUsername}, role=${role}`);

  try {
    await prisma.user.create({
      data: {
        username: normalizedUsername,
        password: hashedPassword,
        role: role,
      },
    });
    console.log(`[Registration] Success: username=${normalizedUsername}`);
  } catch (e) {
    console.error(`[Registration] Error:`, e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[Registration] Prisma code:`, e.code, `meta:`, e.meta);
      if (e.code === 'P2002') return { error: "Username already taken." };
    }
    return { error: "Registration failed." };
  }

  redirect("/login?registered=true");
}

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function loginUser(prevState: any, formData: FormData) {
  // Get IP address for rate limiting (Vercel-compatible)
  const headerList = await headers();
  let ip = headerList.get("x-vercel-forwarded-for") ||  // Vercel's trusted header
           headerList.get("x-real-ip");                  // Docker/nginx standard

  if (!ip) {
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      ip = forwarded.split(",")[0].trim();
    }
  }

  ip = ip || "unknown";

  // Check rate limit
  const rateLimit = checkLoginRateLimit(ip);
  if (!rateLimit.success) {
    const timeLeft = Math.ceil((rateLimit.resetAt! - Date.now()) / 1000);
    return { error: `Too many login attempts. Please wait ${timeLeft} seconds.` };
  }

  const data = Object.fromEntries(formData.entries());
  const validated = loginSchema.safeParse(data);

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { username, password } = validated.data;
  const normalizedUsername = username.toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (!user || !user.password) {
      return { error: "Invalid username or password." };
    }

    // Check if user is banned
    if (user.isBanned) {
      return { error: "This account has been banned." };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return { error: "Invalid username or password." };
    }

    // Sign in the user using NextAuth
    const result = await signIn("credentials", {
      username: normalizedUsername,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Login failed. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

