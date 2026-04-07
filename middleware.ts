import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";

const STUDENT_ROUTES = new Set([
  "/",
  "/profile",
  "/requests",
  "/bmi",
  "/history",
  "/schedule",
  "/status",
  "/reserve",
  "/help",
  "/complete-profile",
]);

function isStudentRoute(pathname: string): boolean {
  return STUDENT_ROUTES.has(pathname);
}

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

const STUDENT_API_PREFIXES = [
  "/api/profile",
  "/api/reserve",
  "/api/bmi",
  "/api/clinic-requests",
  "/api/clinic-weekly-schedule",
  "/api/clinic/",
  "/api/filter-",
];

const ADMIN_API_PREFIXES = [
  "/api/admin",
  "/api/admin-stats",
  "/api/reports",
];

function isStudentApi(pathname: string): boolean {
  return STUDENT_API_PREFIXES.some((p) => pathname.startsWith(p));
}

function isAdminApi(pathname: string): boolean {
  return ADMIN_API_PREFIXES.some((p) => pathname.startsWith(p));
}

function isPublicApi(pathname: string): boolean {
  return pathname.startsWith("/api/auth/");
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role;

  // Login page: signed-in users are routed to their portal.
  if (pathname === "/login") {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    if (role === "STUDENT") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // Root: signed-out -> login; signed-in routed by role.
  if (pathname === "/") {
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    if (role !== "STUDENT") {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (isAdminApi(pathname) && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (isStudentApi(pathname) && role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    return NextResponse.next();
  }

  const isProtected = isStudentRoute(pathname) || isAdminRoute(pathname);
  if (!isProtected) {
    return NextResponse.next();
  }

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAdminRoute(pathname) && role !== "ADMIN") {
    if (role === "STUDENT") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isStudentRoute(pathname) && role !== "STUDENT") {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
