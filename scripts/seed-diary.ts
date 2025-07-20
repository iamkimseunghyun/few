import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const { musicDiaries, users, diaryLikes } = schema;

async function seedDiary() {
  console.log('🌱 Starting diary seed...');

  try {
    // Get a user first
    const allUsers = await db.select().from(users).limit(1);
    
    if (allUsers.length === 0) {
      console.log('No users found. Please run seed-database.ts first.');
      return;
    }

    const user = allUsers[0];
    console.log(`Creating diaries for user: ${user.username}`);

    // Create sample diaries
    // Note: Using placeholder images for seed data. In production, users would upload to Cloudflare Images
    const diaryData = [
      {
        userId: user.id,
        caption: '2024 Ultra Korea 정말 최고였어요! Martin Garrix 세트가 특히 인상적이었습니다. 🎵',
        media: [
          {
            url: '/images/placeholder.svg',
            type: 'image' as const,
            width: 800,
            height: 600
          }
        ],
        location: '잠실종합운동장',
        artists: ['Martin Garrix', 'Hardwell', 'Afrojack'],
        moments: ['환상적인 드롭', '불꽃놀이', '떼창'],
        mood: '열정적',
        eventDate: new Date('2024-06-08'),
        likeCount: 42,
        commentCount: 5,
        viewCount: 150
      },
      {
        userId: user.id,
        caption: '홍대 클럽에서 만난 신인 DJ가 정말 대박이었어요. 앞으로 뜰 것 같은 예감! 💫',
        media: [
          {
            url: '/images/placeholder.svg',
            type: 'image' as const,
            width: 800,
            height: 600
          }
        ],
        location: '홍대 M2',
        artists: ['DJ Unknown', 'Local Heroes'],
        moments: ['새벽 3시 클라이맥스', '관객과의 교감'],
        mood: '신나는',
        eventDate: new Date('2024-06-15'),
        likeCount: 23,
        commentCount: 3,
        viewCount: 89
      },
      {
        userId: user.id,
        caption: '뮤지컬 <오페라의 유령> 재관람. 여전히 감동적이네요. 팬텀의 목소리가 아직도 귓가에 맴돕니다.',
        media: [
          {
            url: '/images/placeholder.svg',
            type: 'image' as const,
            width: 800,
            height: 600
          }
        ],
        location: '블루스퀘어',
        artists: ['전동석', '손지수'],
        moments: ['Music of the Night', '샹들리에 추락 장면'],
        mood: '감동적',
        eventDate: new Date('2024-06-20'),
        likeCount: 67,
        commentCount: 12,
        viewCount: 234
      }
    ];

    // Insert diaries
    const insertedDiaries = [];
    for (const diary of diaryData) {
      const [inserted] = await db.insert(musicDiaries).values(diary).returning();
      insertedDiaries.push(inserted);
      console.log(`Created diary: ${diary.caption.substring(0, 50)}...`);
    }

    // Add some likes to the first diary
    if (insertedDiaries.length > 0) {
      await db.insert(diaryLikes).values({
        userId: user.id,
        diaryId: insertedDiaries[0].id
      }).onConflictDoNothing();
    }

    console.log('✅ Diary seed completed successfully!');
  } catch (error) {
    console.error('❌ Diary seed failed:', error);
    process.exit(1);
  }
}

seedDiary().catch(console.error);