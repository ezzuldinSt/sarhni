import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define protected and public routes
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/owner");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // 2. Check for session token
  // NextAuth v5 (Beta) uses 'authjs.session-token'
  // Production (HTTPS) often uses '__Secure-authjs.session-token'
  const token = 
    request.cookies.get("authjs.session-token")?.value || 
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value; // Fallback for older versions

  // 3. Logic: Redirect Unauthenticated Users
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    // Optional: Add ?callbackUrl= to redirect them back after login
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Logic: Redirect Authenticated Users (Guest Only Pages)
  if (isAuthPage && token) {
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
