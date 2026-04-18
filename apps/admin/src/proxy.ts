import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAuthRequestDebugInfo,
  getSessionDebugInfo,
  logAuthDebug,
} from "@/lib/auth-debug";

const publicPaths = ["/login", "/api/auth"];

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const pathname = request.nextUrl.pathname;
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const requestInfo = getAuthRequestDebugInfo(request.headers);

  if (!session && !isPublicPath) {
    logAuthDebug("proxy.redirectToLogin", {
      pathname,
      ...requestInfo,
      ...getSessionDebugInfo(session),
    });

    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && pathname === "/login") {
    logAuthDebug("proxy.redirectToDashboard", {
      pathname,
      ...requestInfo,
      ...getSessionDebugInfo(session),
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/login" || pathname === "/dashboard") {
    logAuthDebug("proxy.pass", {
      pathname,
      ...requestInfo,
      ...getSessionDebugInfo(session),
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
