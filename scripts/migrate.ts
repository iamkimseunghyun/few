import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  try {
    console.log('Running migration...');
    
    // Add title column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS title varchar(256)
    `);
    
    // Update existing rows with default title
    await db.execute(sql`
      UPDATE reviews 
      SET title = CONCAT('리뷰 - ', LEFT(content, 50)) 
      WHERE title IS NULL
    `);
    
    // Make title NOT NULL
    await db.execute(sql`
      ALTER TABLE reviews 
      ALTER COLUMN title SET NOT NULL
    `);
    
    // Make event_id nullable
    await db.execute(sql`
      ALTER TABLE reviews 
      ALTER COLUMN event_id DROP NOT NULL
    `);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
  process.exit(0);
}

migrate();