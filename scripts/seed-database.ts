import * as dotenv from 'dotenv';
import { db, events, users } from '@/lib/db';

dotenv.config({ path: '.env.local' });

const seedData = {
  users: [
    {
      id: 'admin_user_1',
      username: 'admin',
      email: 'admin@festivaleview.com',
      isAdmin: true,
    },
  ],
  events: [
    {
      id: 'event_1',
      name: '2025 월드 DJ 페스티벌',
      category: '페스티벌',
      location: '서울랜드',
      dates: {
        start: '2025-07-18',
        end: '2025-07-19',
      },
      lineup: ['Martin Garrix', 'David Guetta', 'Marshmello', 'Zedd'],
      description: '세계 최고의 DJ들이 한자리에 모이는 초대형 페스티벌',
      ticketPriceRange: '50,000원 - 150,000원',
      capacity: 30000,
      organizer: 'World DJ Festival Korea',
      website: 'https://worlddjfestival.kr',
    },
    {
      id: 'event_2',
      name: '뮤지컬 <오페라의 유령>',
      category: '공연',
      location: '블루스퀘어 신한카드홀',
      dates: {
        start: '2025-07-15',
        end: '2025-08-31',
      },
      description: '브로드웨이 오리지널 프로덕션으로 돌아온 뮤지컬의 걸작',
      ticketPriceRange: '70,000원 - 160,000원',
      capacity: 1500,
      organizer: 'S&Co',
    },
    {
      id: 'event_3',
      name: '디뮤지엄 : 모네, 빛을 그리다',
      category: '전시',
      location: '디뮤지엄 성수',
      dates: {
        start: '2025-07-01',
        end: '2025-09-30',
      },
      description: '인상주의 거장 모네의 작품을 미디어아트로 재해석한 전시',
      ticketPriceRange: '20,000원 - 30,000원',
      organizer: '디뮤지엄',
      website: 'https://dmuseum.org',
    },
  ],
};

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // Seed users
    console.log('Seeding users...');
    for (const user of seedData.users) {
      await db.insert(users).values(user).onConflictDoNothing();
    }

    // Seed events
    console.log('Seeding events...');
    for (const event of seedData.events) {
      await db.insert(events).values(event).onConflictDoNothing();
    }

    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed().catch(console.error);
