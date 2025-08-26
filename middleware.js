import { NextResponse } from "next/server";

export const config = {
  matcher: [
    "/complaint/:path*",
    "/followup/:path*",
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|maintenance).*)",
  ],
};

export function middleware(request) {
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  if (maintenanceMode && !request.nextUrl.pathname.startsWith("/maintenance")) {
    if (
      request.nextUrl.pathname.startsWith("/_next") ||
      request.nextUrl.pathname === "/api/health-check" ||
      request.nextUrl.pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  if (!maintenanceMode && request.nextUrl.pathname.startsWith("/maintenance")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!maintenanceMode) {
    if (
      request.nextUrl.pathname.startsWith("/complaint") ||
      request.nextUrl.pathname.startsWith("/followup") ||
      request.nextUrl.pathname.startsWith("/admin")
    ) {
      const accessToken = request.cookies.get("access_token")?.value;
      const refreshToken = request.cookies.get("refresh_token")?.value;
      const info = request.cookies.get("info")?.value;
      const permission_paths = request.cookies.get("permission_paths")?.value;

      if (!accessToken || !refreshToken || !info) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const pathname = request.nextUrl.pathname;

      if (
        pathname.startsWith("/complaint") ||
        pathname.startsWith("/followup")
      ) {
        return NextResponse.next();
      }

      if (pathname.startsWith("/admin")) {
        try {
          const allowedPaths = JSON.parse(permission_paths || "[]");
          const canAccess = allowedPaths.some((p) => pathname.startsWith(p));

          if (!canAccess) {
            return NextResponse.redirect(
              new URL("/access-denied", request.url)
            );
          }
          return NextResponse.next();
        } catch (err) {
          console.error("Invalid permission_paths cookie:", err);
          return NextResponse.redirect(new URL("/access-denied", request.url));
        }
      }
    }
  }

  return NextResponse.next();
}