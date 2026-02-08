"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { del } from "@vercel/blob";
import { z } from "zod";

// Bio validation schema
const bioSchema = z.string().max(500, "Bio must be at most 500 characters").optional();

export async function updateUserProfile(formData: FormData) {
  try {
    const session = await auth();
    const userId = formData.get("userId") as string;

    if (!session || session.user.id !== userId) {
      return { error: "Unauthorized" };
    }

    const bio = formData.get("bio") as string;
    const imageUrl = formData.get("imageUrl") as string;

    // Validate bio length
    const bioValidation = bioSchema.safeParse(bio);
    if (!bioValidation.success) {
      return { error: bioValidation.error.errors[0].message };
    }

    const data: any = { bio: bioValidation.data };
    if (imageUrl) data.image = imageUrl;

    await prisma.user.update({
      where: { id: userId },
      data: data,
    });

    // Revalidate all user-related caches
    revalidateTag("user-profiles", {});
    revalidateTag("user-search", {}); // Invalidate search cache when profile changes
    revalidatePath("/dashboard/settings", "page");
    revalidatePath(`/u/${userId}`, "page");
    return { success: true };
  } catch (error) {
    console.error("Update user profile error:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}

export async function deleteProfileImage() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // 1. Get current image URL
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    if (!user?.image) {
      return { error: "No profile image to delete" };
    }

    // 2. Delete from Vercel Blob Storage (if it's a Blob URL)
    if (user.image.includes('blob.vercel-storage.com')) {
      try {
        await del(user.image);
      } catch (error) {
        // Log but don't fail - blob might already be deleted
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to delete blob: ${errorMessage}`);
      }
    }

    // 3. Clear database field
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null }
    });

    // 4. Revalidate caches
    revalidateTag("user-profiles", {});
    revalidateTag("user-search", {}); // Invalidate search cache when image changes
    revalidatePath("/dashboard/settings", "page");
    revalidatePath(`/u/${session.user.name}`, "page");

    return { success: true };
  } catch (error) {
    console.error("Delete profile image error:", error);
    return { error: "Failed to delete profile image. Please try again." };
  }
}

