"use server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client"; // Import Prisma types for error checking

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerUser(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validated = registerSchema.safeParse(data);

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { username, password } = validated.data;
  
  // Normalize to lowercase immediately
  const normalizedUsername = username.toLowerCase();

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // FIX: ATOMIC OPERATION
    // We attempt to create directly. If it fails due to unique constraint, we catch it.
    // This prevents the "Race Condition" where two users register 'Admin' at the exact same millisecond.
    await prisma.user.create({
      data: {
        username: normalizedUsername,
        password: hashedPassword,
      },
    });
  } catch (e) {
    // Check if it's a Prisma unique constraint violation (P2002)
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        return { error: "Username already taken." };
      }
    }
    
    // Log unexpected errors (but don't expose details to user)
    console.error("Registration Error:", e);
    return { error: "Something went wrong. Please try again." };
  }

  // Redirect must happen OUTSIDE the try/catch because Next.js redirect throws an error
  redirect("/login?registered=true");
}
