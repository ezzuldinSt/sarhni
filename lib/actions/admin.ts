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

  return await getCachedAdminUsers(query);
}

// --- 2. BAN HAMMER ---
export async function toggleBan(targetUserId: string) {
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

  revalidateTag("admin-users", "max");
  revalidateTag("user-search", "max");
  revalidatePath("/admin", "page");
  revalidatePath("/owner", "page");
  return { success: true };
}

// --- 3. ROLE MANAGEMENT (OWNER ONLY) ---
export async function updateUserRole(targetUserId: string, newRole: "USER" | "ADMIN") {
  const role = await getCurrentRole();
  
  if (role !== "OWNER") return { error: "Only the Owner can promote users." };

  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole }
  });

  revalidateTag("admin-users", "max");
  revalidatePath("/owner", "page");
  return { success: true };
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

    revalidateTag("admin-users", "max");
    revalidateTag("user-search", "max");
    revalidateTag("user-profiles", "max");
    revalidatePath("/owner", "page");
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

