"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCachedAdminUsers } from "@/lib/cache";

// --- HELPERS ---
async function getCurrentRole() {
  const session = await auth();
  return session?.user?.role || "USER"; // Default to USER
}

// --- 1. USER MANAGEMENT (GET) ---
export async function getAllUsers(query: string = "") {
  const role = await getCurrentRole();
  if (role !== "ADMIN" && role !== "OWNER") return [];

  // OPTIMIZATION: Handle new paginated return format
  const result = await getCachedAdminUsers(query);
  // Backward compatibility: return just users array for existing usage
  return Array.isArray(result) ? result : result.users;
}

// OPTIMIZATION: Paginated admin users with total count
export async function getPaginatedUsers(query: string = "", limit: number = 20, offset: number = 0) {
  const role = await getCurrentRole();
  if (role !== "ADMIN" && role !== "OWNER") return { users: [], total: 0 };

  return await getCachedAdminUsers(query, limit, offset);
}

// --- 2. BAN HAMMER ---
export async function toggleBan(targetUserId: string) {
  try {
    const session = await auth();
    const actorRole = session?.user?.role;

    if (actorRole !== "ADMIN" && actorRole !== "OWNER") return { error: "Unauthorized" };

    // Fetch target
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, isBanned: true }
    });
    if (!target) return { error: "User not found" };

    // HIERARCHY CHECK
    // Admins cannot ban Admins or Owners
    if (actorRole === "ADMIN" && (target.role === "ADMIN" || target.role === "OWNER")) {
      return { error: "You cannot ban your superiors or peers." };
    }
    // Owners cannot ban other Owners (if you had multiple)
    if (actorRole === "OWNER" && target.role === "OWNER") {
       return { error: "You cannot ban another Owner." };
    }

    // Execute
    await prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned: !target.isBanned }
    });

    // OPTIMIZATION: Tag-based revalidation is sufficient
    revalidateTag("admin-users");
    revalidateTag("user-search");
    return { success: true };
  } catch (error) {
    console.error("Toggle ban error:", error);
    return { error: "Failed to update ban status. Please try again." };
  }
}

// --- 3. ROLE MANAGEMENT (OWNER ONLY) ---
export async function updateUserRole(targetUserId: string, newRole: "USER" | "ADMIN") {
  try {
    const role = await getCurrentRole();

    if (role !== "OWNER") return { error: "Only the Owner can promote users." };

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole }
    });

    // OPTIMIZATION: Tag-based revalidation is sufficient
    revalidateTag("admin-users");
    return { success: true };
  } catch (error) {
    console.error("Update user role error:", error);
    return { error: "Failed to update user role. Please try again." };
  }
}

// --- 4. NUCLEAR OPTION (OWNER ONLY) ---
export async function deleteUserCompletely(targetUserId: string) {
  const role = await getCurrentRole();
  if (role !== "OWNER") return { error: "Only the Owner can delete users." };

  try {
    // Cascade delete is usually handled by Prisma relations,
    // but let's be explicit to ensure cleanup
    const deleteConfessions = prisma.confession.deleteMany({
      where: {
        OR: [{ senderId: targetUserId }, { receiverId: targetUserId }]
      }
    });

    const deleteUser = prisma.user.delete({
      where: { id: targetUserId }
    });

    await prisma.$transaction([deleteConfessions, deleteUser]);

    // OPTIMIZATION: Tag-based revalidation is sufficient
    revalidateTag("admin-users");
    revalidateTag("user-search");
    revalidateTag("user-profiles");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes("Record to delete does not exist")) {
        return { error: "User not found." };
      }
      return { error: `Failed to delete user: ${error.message}` };
    }
    return { error: "An unexpected error occurred while deleting the user." };
  }
}

