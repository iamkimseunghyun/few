import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define routes that are accessible without authentication based on current file structure
const isPublicRoute = createRouteMatcher([
  '/', // Homepage
  '/sign-in(.*)', // Clerk sign-in page
  '/sign-up(.*)', // Clerk sign-up page
  '/api(.*)', // All API routes (including tRPC)
  // Add other public routes here as they are created, e.g., '/events', '/reviews/[id]'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Allow access to public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For all other routes, if user is not authenticated, protect them
  if (!userId) {
    await auth.protect();
  }

  // If authenticated, allow access.
  // Further role-based checks can be implemented within page/layout components
  // once corresponding folder structures are in place (e.g., /dashboard, /profile).

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except _next/static, _next/image, and favicon.ico
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Match API routes explicitly
    '/(api|trpc)(.*)',
  ],
};