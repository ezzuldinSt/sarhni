import { Prisma } from "@prisma/client";

// ============================================================================
// CONFESS ION TYPES
// ============================================================================

// 1. Define the shape of a Confession with its relations included
// This matches the `include` in our Prisma queries
export type ConfessionWithUser = Prisma.ConfessionGetPayload<{
  include: {
    sender: { select: { username: true; image: true } };
    receiver: { select: { username: true } };
  }
}>;

// 2. Confession with reply for dashboard
export type ConfessionWithReply = Prisma.ConfessionGetPayload<{
  include: {
    sender: { select: { username: true; image: true } };
    receiver: { select: { username: true } };
  }
}>;

// ============================================================================
// USER TYPES
// ============================================================================

// 3. Define a simpler User type if needed for props
export interface SafeUser {
  id: string;
  username: string;
  image?: string | null;
  role?: string;
}

// 4. Full session user type from NextAuth
// Note: id is optional in NextAuth's Session type but is always present in practice
export interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  isBanned?: boolean;
}

// 5. Session type (matches NextAuth session structure)
export interface SafeSession {
  user?: SessionUser;
  expires: string;
}

// ============================================================================
// FORM STATE TYPES (for Server Actions)
// ============================================================================

// 6. Standard form state for Server Actions
export interface FormState {
  success?: boolean;
  error?: string;
  errors?: Record<string, string[] | string>;
}

// 7. Specific state types for different forms
export interface AuthFormState extends FormState {
  email?: string;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

// 8. Report with relations
export type ReportWithRelations = Prisma.ReportGetPayload<{
  include: {
    confession: {
      include: {
        sender: { select: { username: true } };
        receiver: { select: { username: true } };
      };
    };
    reporter: { select: { username: true } };
    reviewer: { select: { username: true } };
  }
}>;

// ============================================================================
// ADMIN TYPES
// ============================================================================

// 9. Paginated admin users response
export interface PaginatedAdminUsers {
  users: Array<{
    id: string;
    username: string;
    role: string;
    isBanned: boolean;
    createdAt: Date;
  }>;
  total: number;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

// 10. User search result
export interface UserSearchResult {
  username: string;
  image?: string | null;
}

// 11. Search response
export interface SearchResponse {
  users: UserSearchResult[];
  rateLimited?: boolean;
}

// ============================================================================
// RATE LIMIT TYPES
// ============================================================================

// 12. Rate limit result
export interface RateLimitResult {
  success: boolean;
  resetAt?: number;
}
