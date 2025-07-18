import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(DATABASE_URL);

  console.log('🔧 Applying review media migration...');

  try {
    // 1. media_items 컬럼 추가
    await sql`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "media_items" jsonb DEFAULT '[]'::jsonb`;
    console.log('✅ Added media_items column');

    // 2. 기존 imageUrls 데이터를 media_items로 마이그레이션
    await sql`
      UPDATE "reviews" 
      SET "media_items" = (
        SELECT jsonb_agg(
          jsonb_build_object(
            'url', img_url,
            'type', 'image'
          )
        )
        FROM jsonb_array_elements_text("image_urls"::jsonb) AS img_url
      )
      WHERE "image_urls" IS NOT NULL 
        AND "image_urls"::text != '[]'
        AND "image_urls"::text != 'null'
        AND ("media_items" IS NULL OR "media_items"::text = '[]')
    `;
    console.log('✅ Migrated existing imageUrls to media_items');

    // 3. 마이그레이션 결과 확인
    const result = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE "image_urls" IS NOT NULL AND "image_urls"::text != '[]') as with_images,
        COUNT(*) FILTER (WHERE "media_items" IS NOT NULL AND "media_items"::text != '[]') as with_media
      FROM "reviews"
    `;
    
    console.log('📊 Migration results:');
    console.log(`   Reviews with imageUrls: ${result[0].with_images}`);
    console.log(`   Reviews with mediaItems: ${result[0].with_media}`);

    console.log('🎉 Review media migration completed successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  }
}

main().catch(console.error);