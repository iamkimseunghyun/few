import { config } from 'dotenv';
import { db } from '@/lib/db';
import { users, musicDiaries } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// Load environment variables
config({ path: '.env.local' });

async function checkUserData() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.log('사용법: tsx scripts/check-user-data.ts <email>');
      console.log('\n모든 사용자 목록:');
      
      // 모든 사용자 출력
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));

      console.table(allUsers);
    } else {
      // 특정 사용자 정보 출력
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user.length > 0) {
        console.log('\n사용자 정보:');
        console.log(user[0]);

        // 해당 사용자의 다이어리 개수 확인
        const diaryCount = await db
          .select({ count: musicDiaries.id })
          .from(musicDiaries)
          .where(eq(musicDiaries.userId, user[0].id));

        console.log(`\n다이어리 개수: ${diaryCount.length}`);
      } else {
        console.log('해당 이메일의 사용자를 찾을 수 없습니다.');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

checkUserData();