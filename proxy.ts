import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isLegacyRoute = createRouteMatcher([
  "/companies(.*)",
  "/roles(.*)",
  "/applications(.*)",
  "/relationships(.*)",
  "/portfolio(.*)",
  "/analytics(.*)",
  "/digest(.*)",
  "/api/digest(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const e2eToken = process.env.LAUNCH_DESK_E2E_AUTH_TOKEN?.trim();
  if (
    process.env.NODE_ENV !== "production" &&
    e2eToken &&
    request.nextUrl.pathname.startsWith("/api/") &&
    request.headers.get("x-launch-desk-e2e-token") === e2eToken
  ) {
    return NextResponse.next();
  }

  if (!isPublicRoute(request)) await auth.protect();
  if (isLegacyRoute(request) && process.env.LAUNCH_DESK_ENABLE_LEGACY !== "1") {
    return NextResponse.redirect(new URL("/", request.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api)(.*)",
  ],
};
