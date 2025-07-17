import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import superjson from 'superjson';
import type { Context, AuthedContext } from './context';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Initialize tRPC backend
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
  isDev: process.env.NODE_ENV === 'development',
});

/**
 * Create router
 */
export const createTRPCRouter = t.router;

/**
 * Create caller
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Middleware
 */
const middleware = t.middleware;

/**
 * Logging middleware
 */
const loggerMiddleware = middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[tRPC] ${type} ${path} - ${durationMs}ms`);
  }
  
  return result;
});

/**
 * Auth middleware - ensures user is authenticated
 */
const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: '로그인이 필요합니다.',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      user: ctx.user,
    } as AuthedContext,
  });
});

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map<string, number[]>();

const rateLimit = (limit: number, windowMs: number) => {
  return middleware(async ({ ctx, path, next }) => {
    const key = `${ctx.userId || ctx.headers.get('x-forwarded-for') || 'anonymous'}-${path}`;
    const now = Date.now();
    const timestamps = rateLimitMap.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    
    if (validTimestamps.length >= limit) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      });
    }
    
    validTimestamps.push(now);
    rateLimitMap.set(key, validTimestamps);
    
    return next();
  });
};

/**
 * Public procedures
 */
export const publicProcedure = t.procedure
  .use(loggerMiddleware);

/**
 * Protected procedures - require authentication
 */
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(isAuthed);

/**
 * Rate limited procedures
 */
export const rateLimitedProcedure = (limit: number, windowMs: number) => 
  t.procedure
    .use(loggerMiddleware)
    .use(rateLimit(limit, windowMs));

/**
 * Admin procedures - require admin role
 */
export const adminProcedure = t.procedure
  .use(loggerMiddleware)
  .use(isAuthed)
  .use(middleware(async ({ ctx, next }) => {
    // Check if user is admin
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '인증이 필요합니다.',
      });
    }
    
    const user = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);
    
    if (!user[0]?.isAdmin) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '관리자 권한이 필요합니다.',
      });
    }
    
    return next();
  }));