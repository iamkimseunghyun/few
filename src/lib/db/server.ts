import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Supabase pooler requires specific connection string format
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://few_user:few_password@localhost:5432/few_db';

// Check if using Supabase pooler and adjust connection string if needed
const isSupabasePooler = DATABASE_URL.includes('pooler.supabase.com');
const connectionUrl = isSupabasePooler && DATABASE_URL.includes('?') 
  ? DATABASE_URL 
  : isSupabasePooler 
    ? `${DATABASE_URL}?pgbouncer=true`
    : DATABASE_URL;

// Create the connection with better settings for production
const queryClient = postgres(connectionUrl, {
  max: 20, // Increased connection pool size
  idle_timeout: 20,
  connect_timeout: 30, // Increased timeout for Vercel
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  connection: {
    application_name: 'festival-review-app',
  },
  // Retry configuration
  max_lifetime: 60 * 30, // 30 minutes
  prepare: false, // Disable prepared statements for better compatibility
});

// Create the drizzle instance
export const db = drizzle(queryClient, { schema });