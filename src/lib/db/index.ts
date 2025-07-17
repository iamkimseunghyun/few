import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Create and export drizzle instance
export const db = drizzle(process.env.DATABASE_URL!, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Re-export schema for type usage
export * from './schema';