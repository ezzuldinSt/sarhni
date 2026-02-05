"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import fs from "node:fs/promises";
import path from "node:path";

export async function updateUserProfile(formData: FormData) {
  const session = await auth();
  const userId = formData.get("userId") as string;

  if (!session || session.user.id !== userId) {
    return { error: "Unauthorized" };
  }

  const bio = formData.get("bio") as string;
  const imageUrl = formData.get("imageUrl") as string; // Will come from the client logic

  const data: any = { bio };
  if (imageUrl) data.image = imageUrl;

  await prisma.user.update({
    where: { id: userId },
    data: data,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/u/${userId}`); // Just in case
  return { success: true };
}

// ... keep imports and updateUserProfile as they are ...

export async function deleteProfileImage() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // 1. Get current image URL
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true }
  });

  // 2. Check if there is an image to delete
  if (user?.image) {
    try {
      // FIX: Robustly extract "file.jpg" regardless of the URL prefix
      // (works for /api/uploads/file.jpg AND /uploads/file.jpg)
      const filename = user.image.split('/').pop();

      if (filename) {
          // Construct the physical path on the disk
          const filePath = path.join(process.cwd(), "public", "uploads", filename);

          // Delete it
          await fs.unlink(filePath);
      }
    } catch (error) {
      // If file is already gone, just log a warning and continue to clear the DB
      console.warn("Could not delete file from disk:", error);
    }
  }

  // 3. Clear the database field
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: null },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/u/${session.user.name}`);
  return { success: true };
}

