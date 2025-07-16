import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function addReviewSystemFields() {
  try {
    console.log('Adding review system fields...');

    // Add fields to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS total_likes_received INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS best_review_count INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS reviewer_level VARCHAR(20) DEFAULT 'seedling' NOT NULL
    `);

    // Add fields to reviews table
    await db.execute(sql`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS event_name VARCHAR(256),
      ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS is_best_review BOOLEAN DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS best_review_date TIMESTAMP
    `);

    // Create review_helpful table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS review_helpful (
        id TEXT PRIMARY KEY,
        review_id TEXT NOT NULL REFERENCES reviews(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(review_id, user_id)
      )
    `);

    // Update existing review counts
    await db.execute(sql`
      UPDATE users u
      SET review_count = (SELECT COUNT(*) FROM reviews WHERE user_id = u.id)
    `);

    await db.execute(sql`
      UPDATE reviews r
      SET 
        like_count = (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id),
        comment_count = (SELECT COUNT(*) FROM comments WHERE review_id = r.id)
    `);

    console.log('Review system fields added successfully!');
  } catch (error) {
    console.error('Error adding review system fields:', error);
  }
}

addReviewSystemFields();