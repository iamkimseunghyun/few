import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Global singleton for database connection
let db: ReturnType<typeof drizzle> | undefined;
let queryClient: ReturnType<typeof postgres> | undefined;

export function getDb() {
  // Return existing connection if available
  if (db) return db;

  // Supabase pooler requires specific connection string format
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://few_user:few_password@localhost:5432/few_db';

  // Check if using Supabase pooler and adjust connection string if needed
  const isSupabasePooler = DATABASE_URL.includes('pooler.supabase.com');
  const connectionUrl = isSupabasePooler && DATABASE_URL.includes('?') 
    ? DATABASE_URL 
    : isSupabasePooler 
      ? `${DATABASE_URL}?pgbouncer=true&connection_limit=1`
      : DATABASE_URL;

  // Create new connection
  queryClient = postgres(connectionUrl, {
    max: 1, // Single connection for serverless
    idle_timeout: 20,
    connect_timeout: 60,
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    connection: {
      application_name: 'festival-review-app',
    },
    prepare: false,
    // Connection pooling mode optimizations
    fetch_types: false, // Disable type fetching for pooling mode
    // Retry logic
    onnotice: () => {}, // Ignore notices
  });

  // Create drizzle instance
  db = drizzle(queryClient, { schema });

  // Ensure connection is closed on process termination
  if (process.env.NODE_ENV !== 'production') {
    process.on('beforeExit', async () => {
      if (queryClient) {
        await queryClient.end();
      }
    });
  }

  return db;
}

// Export singleton instance
export { getDb as db };