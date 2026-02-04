"use server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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
  
  // FIX: Normalize to lowercase immediately
  const normalizedUsername = username.toLowerCase();

  // Check if user exists (using lowercase)
  const existing = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  });

  if (existing) {
    return { error: "Username already taken." };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user with lowercase username
  await prisma.user.create({
    data: {
      username: normalizedUsername,
      password: hashedPassword,
    },
  });

  redirect("/login?registered=true");
}
