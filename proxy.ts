/**
 * PERFORMANCE: Next.js 16 Proxy for edge-level auth caching
 *
 * This proxy runs at the edge (closer to users) and handles:
 * 1. Auth token validation without hitting the database
 * 2. Route protection for authenticated pages
 * 3. CORS and caching headers for public routes
 *
 * This improves TTFB by reducing database hits for auth checks.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCachedSession } from "@/lib/auth-cached";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define protected and public routes
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/owner");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // 2. PERFORMANCE: Add caching headers for public routes early
  // This allows edge caching of public pages
  const response = NextResponse.next();

  if (!isProtected && !isAuthPage) {
    // Cache public profile pages and search at edge
    if (pathname.startsWith("/u/") || pathname.startsWith("/search")) {
      response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    } else if (pathname === "/") {
      // Homepage can be cached longer
      response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    }
  }

  // 3. Validate session using NextAuth's auth() function
  // This properly validates JWT signature, expiry, and returns null for invalid sessions
  const session = await getCachedSession();

  // Check if user is banned (session exists but user is undefined due to ban)
  const isBanned = session && !session.user;

  // 4. Logic: Redirect Unauthenticated Users
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect banned users to login with error
  if (isProtected && isBanned) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "banned");
    return NextResponse.redirect(loginUrl);
  }

  // 5. Logic: Redirect Authenticated Users (Guest Only Pages)
  if (isAuthPage && session && !isBanned) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Return the response with caching headers
  return response;
}

// Configure which paths the proxy runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (images, uploads, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
}
