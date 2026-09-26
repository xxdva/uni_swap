import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/register", req.url));
  }

  if (req.auth?.user?.isBlocked) {
    return NextResponse.redirect(new URL("/blocked", req.url));
  }

  if (req.nextUrl.pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/profile/:path*", "/matches/:path*", "/sessions/:path*", "/chat/:path*", "/admin/:path*"],
};
