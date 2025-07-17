import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

// Create Neon serverless pool
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Create and export drizzle instance
export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Re-export schema for type usage
export * from './schema';