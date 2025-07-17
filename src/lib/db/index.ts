import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database URL - Remove channel_binding if present
let DATABASE_URL = process.env.DATABASE_URL || 'postgresql://few_user:few_password@localhost:5432/few_db';
// Remove channel_binding parameter which causes issues with some clients
DATABASE_URL = DATABASE_URL.replace('&channel_binding=require', '').replace('?channel_binding=require', '');

// Create postgres client with Neon-optimized settings
const queryClient = postgres(DATABASE_URL, {
  max: 5, // Neon recommends lower connection limits
  idle_timeout: 20, // Keep connections alive longer
  connect_timeout: 10,
  ssl: 'require', // Neon requires SSL
  prepare: false, // Required for Neon's pooler
});

// Create and export drizzle instance
export const db = drizzle(queryClient, { 
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Re-export schema for type usage
export * from './schema';