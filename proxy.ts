import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_super_secret_key_change_me_123456";
const key = new TextEncoder().encode(SECRET_KEY);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isPublicApi =
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register");

  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".json") ||
    pathname.endsWith(".webmanifest") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json";

  if (isPublicApi || isPublicAsset) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, key);
      isAuthenticated = true;
    } catch (e) {
      // Token is invalid/expired
    }
  }

  if (!isAuthenticated && !isAuthPage) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
