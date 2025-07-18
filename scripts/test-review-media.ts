import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(DATABASE_URL);

  console.log('🔍 테스트: 최근 리뷰의 mediaItems 확인...');

  try {
    // 최근 리뷰 조회
    const recentReviews = await sql`
      SELECT id, title, image_urls, media_items, created_at
      FROM "reviews"
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log('\n📊 최근 리뷰 5개:');
    recentReviews.forEach((review, index) => {
      console.log(`\n${index + 1}. ${review.title} (${review.id})`);
      console.log(`   생성일: ${review.created_at}`);
      console.log(`   imageUrls: ${JSON.stringify(review.image_urls)}`);
      console.log(`   mediaItems: ${JSON.stringify(review.media_items)}`);
    });

    // 테스트 업데이트 - 가장 최근 리뷰의 imageUrls를 mediaItems로 변환
    if (recentReviews.length > 0 && recentReviews[0].image_urls?.length > 0) {
      const reviewToUpdate = recentReviews[0];
      console.log(`\n🔧 리뷰 업데이트 테스트: ${reviewToUpdate.id}`);
      
      const mediaItems = reviewToUpdate.image_urls.map((url: string) => ({
        url,
        type: 'image'
      }));
      
      await sql`
        UPDATE "reviews"
        SET "media_items" = ${JSON.stringify(mediaItems)}::jsonb
        WHERE id = ${reviewToUpdate.id}
      `;
      
      // 업데이트 확인
      const updatedReview = await sql`
        SELECT id, title, media_items
        FROM "reviews"
        WHERE id = ${reviewToUpdate.id}
      `;
      
      console.log('✅ 업데이트 완료:', JSON.stringify(updatedReview[0].media_items, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main().catch(console.error);