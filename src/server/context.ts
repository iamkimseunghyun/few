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
    
    // Get full user details if authenticated
    let dbUser = null;
    if (userId) {
      const clerkUser = await currentUser();
      
      // Ensure user exists in database
      if (clerkUser) {
        let existingUser;
        try {
          existingUser = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        } catch (dbError) {
          console.error('Database query error:', dbError);
          // Return minimal context on database error
          return {
            ...contextInner,
            userId,
            user: null,
            headers: opts.req.headers,
          };
        }
        
        if (existingUser.length === 0) {
          // Create user if doesn't exist
          [dbUser] = await db
            .insert(users)
            .values({
              id: userId,
              username: clerkUser.username || clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'user',
              imageUrl: clerkUser.imageUrl,
            })
            .returning();
        } else {
          dbUser = existingUser[0];
        }
      }
    }

    return {
      ...contextInner,
      userId,
      user: dbUser,
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