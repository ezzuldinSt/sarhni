import { cache } from "react";
import { getCachedSession } from "@/lib/auth-cached";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/**
 * Result type for auth check operations
 */
export type AuthUser = {
  id: string;
  username: string;
  role: Role;
  isBanned: boolean;
};

/**
 * Get current user with ban check.
 * Uses session data for ban status (fast path) to avoid unnecessary DB queries.
 * Only queries DB for data not already in session.
 *
 * @returns User data or null if not authenticated/banned
 */
export const getCurrentUserWithBanCheck = cache(async (): Promise<AuthUser | null> => {
  const session = await getCachedSession();
  if (!session?.user?.id) return null;

  // Fast path: Check ban status from session first
  // This avoids a DB query for banned users
  if (session.user.isBanned) return null;

  // Session has id but we need username/role which may not be in session
  // Query only for missing data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, role: true, isBanned: true }
  });

  // Double-check ban status from DB (defense in depth)
  if (!user || user.isBanned) return null;

  return user;
});

/**
 * Require authentication. Throws if user is not authenticated or banned.
 *
 * @returns Authenticated user data
 * @throws Error if unauthorized
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUserWithBanCheck();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require specific role or higher. Throws if user lacks required role.
 *
 * @param minRole - Minimum required role (ADMIN or OWNER)
 * @returns Authenticated user with verified role
 * @throws Error if unauthorized or insufficient permissions
 */
export async function requireRole(minRole: "ADMIN" | "OWNER"): Promise<AuthUser> {
  const user = await requireAuth();

  const roleHierarchy: Record<Role, number> = {
    USER: 0,
    ADMIN: 1,
    OWNER: 2,
  };

  if (roleHierarchy[user.role] < roleHierarchy[minRole]) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return user;
}

/**
 * Check if current user can perform action on target user.
 * Handles role hierarchy checks.
 *
 * @param targetUserId - ID of user to act upon
 * @returns Object with authorization status and reason if denied
 */
export async function canModifyUser(targetUserId: string): Promise<{
  authorized: boolean;
  reason?: string;
}> {
  const actor = await getCurrentUserWithBanCheck();
  if (!actor) {
    return { authorized: false, reason: "Unauthorized" };
  }

  // Can always modify yourself
  if (actor.id === targetUserId) {
    return { authorized: true };
  }

  // Admins and owners can modify others (with hierarchy restrictions)
  if (actor.role === "ADMIN" || actor.role === "OWNER") {
    // Fetch target user to check hierarchy
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true }
    });

    if (!target) {
      return { authorized: false, reason: "User not found" };
    }

    // Admins cannot modify other admins or owners
    if (actor.role === "ADMIN" && (target.role === "ADMIN" || target.role === "OWNER")) {
      return { authorized: false, reason: "You cannot modify your superiors or peers" };
    }

    // Owners cannot modify other owners
    if (actor.role === "OWNER" && target.role === "OWNER") {
      return { authorized: false, reason: "You cannot modify another owner" };
    }

    return { authorized: true };
  }

  // Regular users cannot modify others
  return { authorized: false, reason: "Forbidden" };
}

/**
 * Check if current user can act on target user (for ban/delete operations).
 * Similar to canModifyUser but returns "allowed" property for consistency with admin.ts.
 *
 * @param targetUserId - ID of user to act upon
 * @returns Object with authorization status and reason if denied
 */
export async function canActOnUser(targetUserId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const result = await canModifyUser(targetUserId);
  return { allowed: result.authorized, reason: result.reason };
}

/**
 * Check if we can demote the last owner.
 * Prevents demoting the last owner to avoid lockout.
 *
 * @param targetUserId - ID of owner to demote
 * @returns Object with authorization status and reason if denied
 */
export async function canDemoteLastOwner(targetUserId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // Check if this user is currently an owner
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true }
  });

  if (!targetUser) {
    return { allowed: false, reason: "User not found" };
  }

  // Only need to check if they're currently an owner
  if (targetUser.role !== "OWNER") {
    return { allowed: true };
  }

  // Count total owners
  const ownerCount = await prisma.user.count({
    where: { role: "OWNER" }
  });

  // Cannot demote the last owner
  if (ownerCount <= 1) {
    return { allowed: false, reason: "Cannot demote the last owner" };
  }

  return { allowed: true };
}
