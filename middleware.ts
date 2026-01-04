import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/app(.*)"]);

// Routes that should bypass Clerk entirely (webhooks, public APIs)
const isPublicApiRoute = createRouteMatcher([
  "/api/stripe/webhooks",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicApiRoute(request)) {
      await auth.protect();
    }
  },
  {
    contentSecurityPolicy: {},
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
