"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCachedSession } from "@/lib/auth-cached";
import { del } from "@vercel/blob";
import { z } from "zod";

// Bio validation schema - use nullish to accept both null and undefined
const bioSchema = z.string().max(500, "Bio must be at most 500 characters").nullish();

// Image URL validation schema - prevents XSS via javascript:, data:, etc.
const imageUrlSchema = z.string().max(500).refine((url) => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    // Only allow http: and https: protocols (no javascript:, data:, etc.)
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}, "Invalid image URL").nullish();

export async function updateUserProfile(formData: FormData) {
  try {
    const session = await getCachedSession();
    const userId = formData.get("userId") as string;

    if (!session || session.user.id !== userId) {
      return { error: "Unauthorized" };
    }

    // Get form values - preserve actual values including null
    const bio = formData.get("bio");
    const imageUrl = formData.get("imageUrl");

    // Validate bio length
    const bioValidation = bioSchema.safeParse(bio);
    if (!bioValidation.success) {
      console.error("Bio validation error:", bioValidation.error.errors);
      return { error: bioValidation.error.errors[0].message };
    }

    // Validate image URL (prevent XSS via javascript:, data:, etc.)
    const imageValidationResult = imageUrlSchema.safeParse(imageUrl);
    if (!imageValidationResult.success) {
      console.error("Image URL validation error:", imageValidationResult.error.errors);
      return { error: imageValidationResult.error.errors[0].message };
    }

    // Build update data - only include fields that were explicitly provided
    const data: { bio?: string | null; image?: string | null } = {};
    if (bioValidation.data !== undefined) {
      data.bio = bioValidation.data === "" ? null : bioValidation.data;
    }
    // Only update image if the imageUrl field was actually sent in FormData
    // formData.has() distinguishes between "field not sent" vs "field sent as null/empty"
    if (formData.has("imageUrl")) {
      data.image = imageValidationResult.data === "" || imageValidationResult.data === null
        ? null
        : imageValidationResult.data;
    }

    // Get user's username before updating for cache invalidation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    await prisma.user.update({
      where: { id: userId },
      data: data,
    });

    // OPTIMIZATION: Use path-based revalidation for per-user cache invalidation
    // revalidatePath invalidates only that specific user's page
    // The cache automatically differentiates by username argument
    if (user?.username) {
      revalidatePath(`/u/${user.username}`, "page");
    }
    revalidateTag("user-profiles", {}); // Invalidate user profile cache
    revalidateTag("user-search", {}); // Invalidate search cache
    revalidatePath("/dashboard/settings", "page");
    return { success: true };
  } catch (error) {
    console.error("Update user profile error:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}

export async function deleteProfileImage() {
  try {
    const session = await getCachedSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // 1. Get current image URL and username
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true, username: true }
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

    // 4. Revalidate caches with path-based and tag-based invalidation
    revalidatePath(`/u/${user.username}`, "page");
    revalidateTag("user-profiles", {}); // Invalidate user profile cache
    revalidateTag("user-search", {}); // Invalidate search cache
    revalidatePath("/dashboard/settings", "page");

    return { success: true };
  } catch (error) {
    console.error("Delete profile image error:", error);
    return { error: "Failed to delete profile image. Please try again." };
  }
}
