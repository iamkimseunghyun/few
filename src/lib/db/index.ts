import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database URL and clean it up
let DATABASE_URL = process.env.DATABASE_URL || 'postgresql://few_user:few_password@localhost:5432/few_db';

// Parse and rebuild URL to remove problematic parameters
const url = new URL(DATABASE_URL);
url.searchParams.delete('channel_binding');
DATABASE_URL = url.toString();

// Create postgres client with Neon pooler-optimized settings
const queryClient = postgres(DATABASE_URL, {
  // Neon pooler settings
  max: 1, // Single connection per function instance
  idle_timeout: 0, // Disable idle timeout for pooler
  connect_timeout: 10, // Increase connection timeout
  ssl: process.env.NODE_ENV === 'production' ? 'require' : undefined,
  prepare: false, // Required for Neon's pooler
  // Additional settings for Neon pooler
  connection: {
    application_name: 'few-app'
  }
});

// Create and export drizzle instance
export const db = drizzle(queryClient, { 
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Re-export schema for type usage
export * from './schema';