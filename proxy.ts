import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCachedSession } from "@/lib/auth-cached";
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // First, handle internationalization
  // Skip intl middleware for API routes and other non-page routes
  const shouldSkipIntl = pathname.startsWith('/api') ||
                         pathname.startsWith('/_next') ||
                         pathname.startsWith('/uploads') ||
                         pathname.includes('.');

  if (!shouldSkipIntl) {
    const intlResponse = intlMiddleware(request);
    // If intl middleware returns a response (like a redirect), use it
    if (intlResponse) return intlResponse;
  }

  // 1. Define protected and public routes
  // Need to account for locale prefix in pathnames
  const localePrefixPattern = `^/(${routing.locales.join('|')})`;
  const pathnameWithoutLocale = pathname.replace(new RegExp(localePrefixPattern), '') || '/';

  const isProtected = pathnameWithoutLocale.startsWith("/dashboard") ||
                     pathnameWithoutLocale.startsWith("/admin") ||
                     pathnameWithoutLocale.startsWith("/owner");
  const isAuthPage = pathnameWithoutLocale === "/login" ||
                    pathnameWithoutLocale === "/register";

  // 2. Validate session using NextAuth's auth() function
  // This properly validates JWT signature, expiry, and returns null for invalid sessions
  const session = await getCachedSession();

  // Check if user is banned (session exists but user is undefined due to ban)
  const isBanned = session && !session.user;

  // 3. Logic: Redirect Unauthenticated Users
  if (isProtected && !session) {
    // Get current locale for proper redirect
    const localeMatch = pathname.match(new RegExp(localePrefixPattern));
    const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect banned users to login with error
  if (isProtected && isBanned) {
    const localeMatch = pathname.match(new RegExp(localePrefixPattern));
    const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("error", "banned");
    return NextResponse.redirect(loginUrl);
  }

  // 4. Logic: Redirect Authenticated Users (Guest Only Pages)
  if (isAuthPage && session && !isBanned) {
    const localeMatch = pathname.match(new RegExp(localePrefixPattern));
    const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
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
