import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function addEventBookmarksTable() {
  const sql = postgres(DATABASE_URL);
  const db = drizzle(sql);

  try {
    console.log('Creating event_bookmarks table...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS event_bookmarks (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT unique_event_bookmark UNIQUE (user_id, event_id)
      );
    `;
    
    console.log('✅ event_bookmarks table created successfully');
    
    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_event_bookmarks_user_id ON event_bookmarks(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_event_bookmarks_event_id ON event_bookmarks(event_id);`;
    
    console.log('✅ Indexes created successfully');
    
    await sql.end();
  } catch (error) {
    console.error('Error creating event_bookmarks table:', error);
    await sql.end();
    process.exit(1);
  }
}

addEventBookmarksTable();