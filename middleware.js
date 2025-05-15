import { NextResponse } from "next/server";

export const config = {
  matcher: ["/complaint/:path*", "/followup/:path*", "/admin/:path*"],
};

export function middleware(request) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const info = request.cookies.get("info")?.value;
  const permission_paths = request.cookies.get("permission_paths")?.value;

  if (!accessToken || !refreshToken || !info) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/complaint") || pathname.startsWith("/followup")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    try {
      const allowedPaths = JSON.parse(permission_paths || "[]");

      const hasAnyAdminAccess = allowedPaths.some((p) =>
        p.startsWith("/admin")
      );
      const isRootAdminPath = pathname === "/admin" || pathname === "/admin/";

      if (isRootAdminPath && hasAnyAdminAccess) {
        return NextResponse.next();
      }

      const canAccess = allowedPaths.some((p) => pathname.startsWith(p));
      if (!canAccess) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }
    } catch (err) {
      console.error("Invalid permission_paths cookie:", err);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }
  }

  return NextResponse.next();
}