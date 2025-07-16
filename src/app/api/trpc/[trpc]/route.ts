import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/context';

/**
 * Edge runtime for better performance
 */
export const runtime = 'nodejs';

/**
 * Configure maximum duration for serverless functions
 */
export const maxDuration = 30; // Increased for database operations

const handler = async (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async (opts) => createContext(opts),
    batching: {
      enabled: true,
    },
    responseMeta() {
      return {
        headers: {
          // Cache for 1 second with stale-while-revalidate
          'cache-control': 's-maxage=1, stale-while-revalidate',
        },
      };
    },
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
            if (error.cause) {
              console.error('Cause:', error.cause);
            }
            console.error('Full error:', error);
          }
        : undefined,
  });
};

export { handler as GET, handler as POST };
