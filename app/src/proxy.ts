import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Next 16 renamed `middleware` to `proxy` — same contract, new filename.
const isPublicRoute = createRouteMatcher([
  "/", // landing
  "/login(.*)",
  "/signup(.*)",
  "/api/webhooks(.*)", // GitHub webhooks authenticate via HMAC signature, not Clerk
  "/api/watcher/checkin", // MCP check-ins authenticate via API key
  "/api/jobs(.*)", // cron jobs authenticate via CRON_SECRET bearer token
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
