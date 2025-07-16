import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db/server';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Inner context - things available to all procedures
 */
export async function createContextInner() {
  return {
    db,
  };
}

/**
 * Outer context - auth and request specific things
 */
export async function createContext(opts: FetchCreateContextFnOptions) {
  try {
    const contextInner = await createContextInner();
    const { userId } = await auth();
    
    // Return early if no userId - no need to query database
    if (!userId) {
      return {
        ...contextInner,
        userId: null,
        user: null,
        headers: opts.req.headers,
      };
    }

    // For now, just return userId without fetching full user data
    // User data will be fetched only when needed by specific procedures
    return {
      ...contextInner,
      userId,
      user: null, // Don't fetch user data on every request
      headers: opts.req.headers,
    };
  } catch (error) {
    console.error('Error creating context:', error);
    // Return minimal context on error
    return {
      db,
      userId: null,
      user: null,
      headers: opts.req.headers,
    };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;

// Helper type for procedures that require auth
export type AuthedContext = Context & {
  userId: string;
  user: NonNullable<Context['user']>;
};