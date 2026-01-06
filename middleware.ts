import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/app", "/admin"];

// Routes that require admin privileges
const adminRoutes = ["/admin", "/api/admin"];

// Routes that should bypass auth entirely (webhooks, public APIs, auth routes)
const publicRoutes = [
  "/api/auth", // next-auth routes
  "/api/stripe/webhooks",
  "/api/webhooks",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip auth for public routes (auth routes, webhooks, etc.)
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !req.auth) {
    // Redirect to sign in
    const signInUrl = new URL("/api/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check if route requires admin privileges
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isAdminRoute && (!req.auth || !req.auth.user?.isAdmin)) {
    // Redirect non-admin users to app home
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
