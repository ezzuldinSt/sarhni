"use server";

import { requireRole, canActOnUser, canDemoteLastOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCachedAdminUsers } from "@/lib/cache";

// ============================================================================
// USER MANAGEMENT (GET)
// ============================================================================

export async function getAllUsers(query: string = "") {
  const user = await requireRole("ADMIN");

  // OPTIMIZATION: Handle new paginated return format
  const result = await getCachedAdminUsers(query);
  // Backward compatibility: return just users array for existing usage
  return Array.isArray(result) ? result : result.users;
}

// OPTIMIZATION: Paginated admin users with total count
export async function getPaginatedUsers(query: string = "", limit: number = 20, offset: number = 0) {
  await requireRole("ADMIN");
  return await getCachedAdminUsers(query, limit, offset);
}

// ============================================================================
// BAN HAMMER
// ============================================================================

export async function toggleBan(targetUserId: string) {
  try {
    const actor = await requireRole("ADMIN");

    // Check hierarchy permissions
    const check = await canActOnUser(targetUserId);
    if (!check.allowed) {
      return { error: check.reason || "Unauthorized" };
    }

    // Fetch target
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, isBanned: true }
    });
    if (!target) return { error: "User not found" };

    // HIERARCHY CHECK
    // Admins cannot ban Admins or Owners
    if (actor.role === "ADMIN" && (target.role === "ADMIN" || target.role === "OWNER")) {
      return { error: "You cannot ban your superiors or peers." };
    }
    // Owners cannot ban other Owners
    if (actor.role === "OWNER" && target.role === "OWNER") {
       return { error: "You cannot ban another Owner." };
    }

    // Execute
    await prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned: !target.isBanned }
    });

    revalidateTag("admin-users", {});
    revalidateTag("user-search", {});
    return { success: true };
  } catch (error) {
    console.error("Toggle ban error:", error);
    return { error: "Failed to update ban status. Please try again." };
  }
}

// ============================================================================
// ROLE MANAGEMENT (OWNER ONLY)
// ============================================================================

export async function updateUserRole(targetUserId: string, newRole: "USER" | "ADMIN" | "OWNER") {
  try {
    const owner = await requireRole("OWNER");

    // Fetch target user's current role to check if we're demoting an OWNER
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true }
    });

    if (!targetUser) {
      return { error: "User not found." };
    }

    // Check if we can demote this owner
    if (targetUser.role === "OWNER" && newRole !== "OWNER") {
      const canDemote = await canDemoteLastOwner(targetUserId);
      if (!canDemote.allowed) {
        return { error: canDemote.reason };
      }
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole }
    });

    revalidateTag("admin-users", {});
    return { success: true };
  } catch (error) {
    console.error("Update user role error:", error);
    return { error: "Failed to update user role. Please try again." };
  }
}

// ============================================================================
// NUCLEAR OPTION (OWNER ONLY)
// ============================================================================

export async function deleteUserCompletely(targetUserId: string) {
  const actor = await requireRole("OWNER");

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

    revalidateTag("admin-users", {});
    revalidateTag("user-search", {});
    revalidateTag("user-profiles", {});
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
