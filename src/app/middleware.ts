import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const sessionId = req.cookies.get("sessionId");
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");

  // if (!sessionId && !isLoginPage) {
    // return NextResponse.redirect(new URL("/login", req.url));
  // }

  // if (sessionId && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|favicon.ico).*)"],
};
