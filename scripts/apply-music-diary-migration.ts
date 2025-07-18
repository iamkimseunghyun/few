import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('🚀 Applying music diary migration...');

  try {
    // Check if media_type enum exists
    const enumExists = await sql`
      SELECT 1 FROM pg_type WHERE typname = 'media_type'
    `;
    
    if (enumExists.length === 0) {
      await sql`CREATE TYPE "public"."media_type" AS ENUM('image', 'video')`;
      console.log('✅ Created media_type enum');
    } else {
      console.log('ℹ️ media_type enum already exists');
    }

    // Create music_diaries table
    await sql`
      CREATE TABLE IF NOT EXISTS "music_diaries" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "event_id" text,
        "caption" text,
        "location" text,
        "media" json NOT NULL,
        "artists" json,
        "setlist" json,
        "moments" json,
        "mood" varchar(50),
        "like_count" integer DEFAULT 0 NOT NULL,
        "comment_count" integer DEFAULT 0 NOT NULL,
        "view_count" integer DEFAULT 0 NOT NULL,
        "is_public" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ Created music_diaries table');

    // Create diary_comments table
    await sql`
      CREATE TABLE IF NOT EXISTS "diary_comments" (
        "id" text PRIMARY KEY NOT NULL,
        "diary_id" text NOT NULL,
        "user_id" text NOT NULL,
        "content" text NOT NULL,
        "like_count" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ Created diary_comments table');

    // Create diary_likes table
    await sql`
      CREATE TABLE IF NOT EXISTS "diary_likes" (
        "id" text PRIMARY KEY NOT NULL,
        "diary_id" text NOT NULL,
        "user_id" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ Created diary_likes table');

    // Create diary_saves table
    await sql`
      CREATE TABLE IF NOT EXISTS "diary_saves" (
        "id" text PRIMARY KEY NOT NULL,
        "diary_id" text NOT NULL,
        "user_id" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ Created diary_saves table');

    // Create media_queue table
    await sql`
      CREATE TABLE IF NOT EXISTS "media_queue" (
        "id" text PRIMARY KEY NOT NULL,
        "diary_id" text NOT NULL,
        "original_url" text NOT NULL,
        "processed_url" text,
        "thumbnail_url" text,
        "status" varchar(20) DEFAULT 'pending' NOT NULL,
        "metadata" json,
        "error" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "processed_at" timestamp
      )
    `;
    console.log('✅ Created media_queue table');

    // Add foreign key constraints
    await sql`
      ALTER TABLE "music_diaries" 
      ADD CONSTRAINT "music_diaries_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
      ON DELETE no action ON UPDATE no action
    `;
    
    await sql`
      ALTER TABLE "music_diaries" 
      ADD CONSTRAINT "music_diaries_event_id_events_id_fk" 
      FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") 
      ON DELETE no action ON UPDATE no action
    `;

    await sql`
      ALTER TABLE "diary_comments" 
      ADD CONSTRAINT "diary_comments_diary_id_music_diaries_id_fk" 
      FOREIGN KEY ("diary_id") REFERENCES "public"."music_diaries"("id") 
      ON DELETE cascade ON UPDATE no action
    `;

    await sql`
      ALTER TABLE "diary_comments" 
      ADD CONSTRAINT "diary_comments_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
      ON DELETE no action ON UPDATE no action
    `;

    await sql`
      ALTER TABLE "diary_likes" 
      ADD CONSTRAINT "diary_likes_diary_id_music_diaries_id_fk" 
      FOREIGN KEY ("diary_id") REFERENCES "public"."music_diaries"("id") 
      ON DELETE cascade ON UPDATE no action
    `;

    await sql`
      ALTER TABLE "diary_likes" 
      ADD CONSTRAINT "diary_likes_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
      ON DELETE no action ON UPDATE no action
    `;

    await sql`
      ALTER TABLE "diary_saves" 
      ADD CONSTRAINT "diary_saves_diary_id_music_diaries_id_fk" 
      FOREIGN KEY ("diary_id") REFERENCES "public"."music_diaries"("id") 
      ON DELETE cascade ON UPDATE no action
    `;

    await sql`
      ALTER TABLE "diary_saves" 
      ADD CONSTRAINT "diary_saves_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
      ON DELETE no action ON UPDATE no action
    `;

    await sql`
      ALTER TABLE "media_queue" 
      ADD CONSTRAINT "media_queue_diary_id_music_diaries_id_fk" 
      FOREIGN KEY ("diary_id") REFERENCES "public"."music_diaries"("id") 
      ON DELETE cascade ON UPDATE no action
    `;

    console.log('✅ Added all foreign key constraints');
    console.log('✨ Music diary migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();