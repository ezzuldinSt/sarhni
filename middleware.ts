import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define protected and public routes
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/owner");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // 2. Validate session using NextAuth's auth() function
  // This properly validates JWT signature, expiry, and returns null for invalid sessions
  const session = await auth();

  // Check if user is banned (session exists but user is undefined due to ban)
  const isBanned = session && !session.user;

  // 3. Logic: Redirect Unauthenticated Users
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

  // 4. Logic: Redirect Authenticated Users (Guest Only Pages)
  if (isAuthPage && session && !isBanned) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which paths the middleware runs on
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
