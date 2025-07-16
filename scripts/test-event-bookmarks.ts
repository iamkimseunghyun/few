import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { eventBookmarks } from '../src/lib/db/schema';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function testEventBookmarks() {
  const sql = postgres(DATABASE_URL);
  const db = drizzle(sql);

  try {
    // Check if event_bookmarks table exists
    const result = await db.select().from(eventBookmarks).limit(1);
    console.log('✅ event_bookmarks table exists and is accessible');
    console.log('Row count:', result.length);
    
    await sql.end();
  } catch (err) {
    console.error('❌ Error accessing event_bookmarks table:', err);
    await sql.end();
    process.exit(1);
  }
}

testEventBookmarks();