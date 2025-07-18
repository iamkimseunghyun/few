import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(DATABASE_URL);

  console.log('🔍 비디오가 포함된 리뷰 검색 중...');

  try {
    // 비디오가 포함된 리뷰 찾기
    const reviewsWithVideos = await sql`
      SELECT id, title, media_items
      FROM "reviews"
      WHERE media_items IS NOT NULL
        AND media_items::text != '[]'
        AND EXISTS (
          SELECT 1 
          FROM jsonb_array_elements(media_items) AS item
          WHERE item->>'type' = 'video'
        )
    `;
    
    if (reviewsWithVideos.length === 0) {
      console.log('❌ 비디오가 포함된 리뷰가 없습니다.');
      
      // 모든 리뷰의 media_items 내용 확인
      const allReviews = await sql`
        SELECT id, title, media_items
        FROM "reviews"
        WHERE media_items IS NOT NULL
          AND media_items::text != '[]'
        ORDER BY created_at DESC
        LIMIT 5
      `;
      
      console.log('\n📊 최근 media_items가 있는 리뷰:');
      allReviews.forEach((review, index) => {
        console.log(`\n${index + 1}. ${review.title} (${review.id})`);
        console.log('   mediaItems:', JSON.stringify(review.media_items, null, 2));
      });
    } else {
      console.log(`\n✅ 비디오가 포함된 리뷰 ${reviewsWithVideos.length}개 발견:`);
      reviewsWithVideos.forEach((review, index) => {
        console.log(`\n${index + 1}. ${review.title} (${review.id})`);
        console.log('   mediaItems:', JSON.stringify(review.media_items, null, 2));
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main().catch(console.error);