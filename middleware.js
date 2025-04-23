import { NextResponse } from "next/server";

export const config = {
  matcher: ["/complaint/:path*", "/followup/:path*", "/admin/:path*"],
};

export function middleware(request) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const info = request.cookies.get("info")?.value;

  if (!accessToken || !refreshToken || !info) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
