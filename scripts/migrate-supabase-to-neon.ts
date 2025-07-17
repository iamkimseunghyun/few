import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/lib/db/schema';

// Supabase connection (기존 DATABASE_URL을 임시로 SUPABASE_URL로 저장)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const NEON_URL = process.env.DATABASE_URL || '';

if (!SUPABASE_URL || !NEON_URL) {
  console.error('❌ SUPABASE_URL 또는 DATABASE_URL이 설정되지 않았습니다.');
  console.log('💡 .env.local에 다음과 같이 설정하세요:');
  console.log('SUPABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres');
  console.log('DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
  process.exit(1);
}

// Supabase 연결
const supabaseSql = postgres(SUPABASE_URL, {
  ssl: 'require',
  prepare: false,
});
const supabaseDb = drizzle(supabaseSql, { schema });

// Neon 연결
const neonSql = postgres(NEON_URL.replace('&channel_binding=require', ''), {
  ssl: 'require',  
  prepare: false,
});
const neonDb = drizzle(neonSql, { schema });

async function migrateData() {
  console.log('🔄 Supabase에서 Neon으로 데이터 마이그레이션 시작...\n');

  try {
    // 1. Users 마이그레이션
    console.log('👥 Users 마이그레이션 중...');
    const users = await supabaseDb.select().from(schema.users);
    console.log(`  - ${users.length}개의 사용자 발견`);
    
    if (users.length > 0) {
      for (const user of users) {
        await neonDb.insert(schema.users).values(user).onConflictDoNothing();
      }
      console.log('  ✅ Users 마이그레이션 완료\n');
    }

    // 2. Events 마이그레이션
    console.log('🎪 Events 마이그레이션 중...');
    const events = await supabaseDb.select().from(schema.events);
    console.log(`  - ${events.length}개의 이벤트 발견`);
    
    if (events.length > 0) {
      for (const event of events) {
        await neonDb.insert(schema.events).values(event).onConflictDoNothing();
      }
      console.log('  ✅ Events 마이그레이션 완료\n');
    }

    // 3. Reviews 마이그레이션
    console.log('📝 Reviews 마이그레이션 중...');
    const reviews = await supabaseDb.select().from(schema.reviews);
    console.log(`  - ${reviews.length}개의 리뷰 발견`);
    
    if (reviews.length > 0) {
      for (const review of reviews) {
        await neonDb.insert(schema.reviews).values(review).onConflictDoNothing();
      }
      console.log('  ✅ Reviews 마이그레이션 완료\n');
    }

    // 4. Comments 마이그레이션
    console.log('💬 Comments 마이그레이션 중...');
    const comments = await supabaseDb.select().from(schema.comments);
    console.log(`  - ${comments.length}개의 댓글 발견`);
    
    if (comments.length > 0) {
      for (const comment of comments) {
        await neonDb.insert(schema.comments).values(comment).onConflictDoNothing();
      }
      console.log('  ✅ Comments 마이그레이션 완료\n');
    }

    // 5. Review Likes 마이그레이션
    console.log('👍 Review Likes 마이그레이션 중...');
    const reviewLikes = await supabaseDb.select().from(schema.reviewLikes);
    console.log(`  - ${reviewLikes.length}개의 좋아요 발견`);
    
    if (reviewLikes.length > 0) {
      for (const like of reviewLikes) {
        await neonDb.insert(schema.reviewLikes).values(like).onConflictDoNothing();
      }
      console.log('  ✅ Review Likes 마이그레이션 완료\n');
    }

    // 6. Review Bookmarks 마이그레이션
    console.log('🔖 Review Bookmarks 마이그레이션 중...');
    const reviewBookmarks = await supabaseDb.select().from(schema.reviewBookmarks);
    console.log(`  - ${reviewBookmarks.length}개의 북마크 발견`);
    
    if (reviewBookmarks.length > 0) {
      for (const bookmark of reviewBookmarks) {
        await neonDb.insert(schema.reviewBookmarks).values(bookmark).onConflictDoNothing();
      }
      console.log('  ✅ Review Bookmarks 마이그레이션 완료\n');
    }

    // 7. Event Bookmarks 마이그레이션
    console.log('📌 Event Bookmarks 마이그레이션 중...');
    const eventBookmarks = await supabaseDb.select().from(schema.eventBookmarks);
    console.log(`  - ${eventBookmarks.length}개의 이벤트 북마크 발견`);
    
    if (eventBookmarks.length > 0) {
      for (const bookmark of eventBookmarks) {
        await neonDb.insert(schema.eventBookmarks).values(bookmark).onConflictDoNothing();
      }
      console.log('  ✅ Event Bookmarks 마이그레이션 완료\n');
    }

    // 8. Notifications 마이그레이션
    console.log('🔔 Notifications 마이그레이션 중...');
    const notifications = await supabaseDb.select().from(schema.notifications);
    console.log(`  - ${notifications.length}개의 알림 발견`);
    
    if (notifications.length > 0) {
      for (const notification of notifications) {
        await neonDb.insert(schema.notifications).values(notification).onConflictDoNothing();
      }
      console.log('  ✅ Notifications 마이그레이션 완료\n');
    }

    // 9. Review Reports 마이그레이션
    console.log('🚨 Review Reports 마이그레이션 중...');
    const reviewReports = await supabaseDb.select().from(schema.reviewReports);
    console.log(`  - ${reviewReports.length}개의 신고 발견`);
    
    if (reviewReports.length > 0) {
      for (const report of reviewReports) {
        await neonDb.insert(schema.reviewReports).values(report).onConflictDoNothing();
      }
      console.log('  ✅ Review Reports 마이그레이션 완료\n');
    }

    // 10. Review Helpful 마이그레이션
    console.log('🤝 Review Helpful 마이그레이션 중...');
    const reviewHelpful = await supabaseDb.select().from(schema.reviewHelpful);
    console.log(`  - ${reviewHelpful.length}개의 도움됨 표시 발견`);
    
    if (reviewHelpful.length > 0) {
      for (const helpful of reviewHelpful) {
        await neonDb.insert(schema.reviewHelpful).values(helpful).onConflictDoNothing();
      }
      console.log('  ✅ Review Helpful 마이그레이션 완료\n');
    }

    console.log('🎉 모든 데이터 마이그레이션이 완료되었습니다!');

    // 마이그레이션 요약
    console.log('\n📊 마이그레이션 요약:');
    console.log(`  - Users: ${users.length}개`);
    console.log(`  - Events: ${events.length}개`);
    console.log(`  - Reviews: ${reviews.length}개`);
    console.log(`  - Comments: ${comments.length}개`);
    console.log(`  - Review Likes: ${reviewLikes.length}개`);
    console.log(`  - Review Bookmarks: ${reviewBookmarks.length}개`);
    console.log(`  - Event Bookmarks: ${eventBookmarks.length}개`);
    console.log(`  - Notifications: ${notifications.length}개`);
    console.log(`  - Review Reports: ${reviewReports.length}개`);
    console.log(`  - Review Helpful: ${reviewHelpful.length}개`);

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
  } finally {
    await supabaseSql.end();
    await neonSql.end();
  }
}

// 실행
migrateData();