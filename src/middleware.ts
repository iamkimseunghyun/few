import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define routes that are accessible without authentication based on the current file structure
const isPublicRoute = createRouteMatcher([
  '/', // Homepage
  '/reviews',
  '/events',
  '/events/(.*)', // Event detail pages
  '/diary', // Diary feed page
  '/search', // Search page
  '/sign-in(.*)', // Clerk sign-in page
  '/sign-up(.*)', // Clerk sign-up page
  '/api(.*)', // All API routes (including tRPC)
  // Add other public routes here as they are created, e.g., '/reviews/[id]'
]);

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/diary/new', // Create new diary
  '/diary/[id]/edit', // Edit diary
  '/profile', // User profile
  '/settings', // User settings
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  // Check if this is a protected route
  if (isProtectedRoute(req)) {
    if (!userId) {
      await auth.protect();
    }
    return NextResponse.next();
  }

  // Check if this is a diary detail page (e.g., /diary/123)
  // These should be public
  if (path.startsWith('/diary/') && !isProtectedRoute(req)) {
    return NextResponse.next();
  }

  // Allow access to public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For all other routes, if a user is not authenticated, protect them
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
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
