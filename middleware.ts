import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login", "/signup", "/api/auth", "/favicon", "/icon", "/apple-icon"];
const ADMIN_PATHS = ["/admin", "/settings"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path));
}

function requiresAdmin(pathname: string) {
  return ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(path));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (isPublic(pathname)) {
    if (
      user &&
      user.status === "ACTIVE" &&
      (pathname === "/login" || pathname === "/signup")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user.status !== "ACTIVE") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("message", user.status.toLowerCase());
    return NextResponse.redirect(loginUrl);
  }

  if (requiresAdmin(pathname) && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|ico)|api/public).*)"],
};
