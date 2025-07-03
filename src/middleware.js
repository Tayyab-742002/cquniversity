import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/tests(.*)',
  '/dashboard(.*)',
  '/api/participants(.*)',
  '/api/test-results(.*)',
  '/api/admin(.*)',
  '/api/debug/participants(.*)',
  '/api/debug/test-results(.*)',
  '/api/debug/migrate-schema(.*)'
]);

// Define public debug routes that don't need auth
const isPublicDebugRoute = createRouteMatcher([
  '/api/debug/db-status(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Only protect specific routes that require authentication
  // Skip protection for public debug routes
  if (isProtectedRoute(req) && !isPublicDebugRoute(req)) {
    await auth.protect();
  }
  // All other routes (including /, /about, /sign-in, /sign-up) are public
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 