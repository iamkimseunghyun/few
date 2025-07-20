import { config } from 'dotenv';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config({ path: '.env.local' });

async function syncUserData() {
  try {
    // 여기에 동기화하려는 사용자의 Clerk ID를 입력하세요
    const clerkUserId = process.argv[2];
    const isAdmin = process.argv[3] === 'true';

    if (!clerkUserId) {
      console.error('사용법: tsx scripts/sync-user-data.ts <clerk-user-id> [true|false]');
      process.exit(1);
    }

    console.log(`사용자 데이터 동기화 중: ${clerkUserId}`);
    console.log(`관리자 권한: ${isAdmin}`);

    // 사용자 업데이트
    const result = await db
      .update(users)
      .set({
        isAdmin: isAdmin,
        updatedAt: new Date(),
      })
      .where(eq(users.id, clerkUserId))
      .returning();

    if (result.length > 0) {
      console.log('✅ 사용자 데이터가 성공적으로 업데이트되었습니다:', result[0]);
    } else {
      console.log('❌ 해당 사용자를 찾을 수 없습니다.');
    }

    process.exit(0);
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

syncUserData();