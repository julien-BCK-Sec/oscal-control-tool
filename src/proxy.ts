import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic route protection (ADR-015). This proxy only checks for the
 * presence of a signed session cookie and redirects unauthenticated users to
 * the sign-in page. Authoritative session validation and authorization always
 * happen server-side in Server Components and Server Actions — this is a
 * redirect convenience, never the security boundary.
 *
 * (Next.js 16 renamed the `middleware` file convention to `proxy`.)
 */
export function proxy(request: NextRequest): NextResponse {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/projects/:path*", "/organizations/:path*"],
};
