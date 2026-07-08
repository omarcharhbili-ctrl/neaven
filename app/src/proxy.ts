import { clerkMiddleware } from "@clerk/nextjs/server";

// Frontend rolled back to the original mock screens (a1a621c) — nothing is
// auth-gated while we rebuild step by step. clerkMiddleware still runs so
// the API routes' auth() calls keep working once sign-in is reintroduced;
// until then, unauthenticated API calls return 401 and pages browse freely.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
