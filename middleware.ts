import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/portal(.*)',
  '/api/portal(.*)',
  '/api/clients/intake(.*)',
  '/api/upload/update-metadata(.*)',
  '/calendar(.*)', // this is just for testing on xcode simulator
  '/api/portal/sign-upload',
  '/api/portal/delete-upload'
])

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.host === 'localhost:3000') {
      return NextResponse.next();
    }
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};