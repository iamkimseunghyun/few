import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(DATABASE_URL);

  console.log('🔧 Applying follows table constraints and indexes...');

  try {
    // 인덱스 추가
    await sql`CREATE INDEX IF NOT EXISTS "idx_follows_follower_id" ON "follows" ("follower_id")`;
    console.log('✅ Created index: idx_follows_follower_id');

    await sql`CREATE INDEX IF NOT EXISTS "idx_follows_following_id" ON "follows" ("following_id")`;
    console.log('✅ Created index: idx_follows_following_id');

    await sql`CREATE INDEX IF NOT EXISTS "idx_follows_created_at" ON "follows" ("created_at" DESC)`;
    console.log('✅ Created index: idx_follows_created_at');

    // Unique constraint 추가 (중복 팔로우 방지)
    await sql`ALTER TABLE "follows" ADD CONSTRAINT "unique_follow" UNIQUE("follower_id", "following_id")`;
    console.log('✅ Added unique constraint: unique_follow');

    // Check constraint 추가 (자기 자신 팔로우 방지)
    await sql`ALTER TABLE "follows" ADD CONSTRAINT "check_no_self_follow" CHECK ("follower_id" != "following_id")`;
    console.log('✅ Added check constraint: check_no_self_follow');

    console.log('🎉 All constraints and indexes applied successfully!');
  } catch (error) {
    console.error('❌ Error applying constraints:', error);
    throw error;
  }
}

main().catch(console.error);