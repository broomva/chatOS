import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPaths = ["/chat", "/api/chat"];
const authPaths = ["/login", "/register"];

export function createAuthMiddleware(_sessionCheckUrl: string) {
  return async function authMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
    const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

    if (!isProtected && !isAuthPath) {
      return NextResponse.next();
    }

    const sessionCookie = request.cookies.get("better-auth.session_token");

    if (isProtected && !sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isAuthPath && sessionCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  };
}
