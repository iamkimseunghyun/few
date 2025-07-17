import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database URL and clean it up
let DATABASE_URL = process.env.DATABASE_URL || 'postgresql://few_user:few_password@localhost:5432/few_db';

// Parse and rebuild URL to remove problematic parameters
const url = new URL(DATABASE_URL);
url.searchParams.delete('channel_binding');
DATABASE_URL = url.toString();

// Create postgres client with serverless-optimized settings
const queryClient = postgres(DATABASE_URL, {
  // Serverless environment settings
  max: 1, // Single connection per function instance
  idle_timeout: 10, // Quick timeout for serverless
  connect_timeout: 5, // Faster connection timeout
  ssl: process.env.NODE_ENV === 'production' ? 'require' : undefined,
  prepare: false, // Required for Neon's pooler
  // Connection pooling is handled by Neon's pooler endpoint
});

// Create and export drizzle instance
export const db = drizzle(queryClient, { 
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Re-export schema for type usage
export * from './schema';