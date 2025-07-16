import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { events } from '../src/lib/db/schema';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function add2025Events() {
  const sql = postgres(DATABASE_URL);
  const db = drizzle(sql);

  try {
    const newEvents = [
      {
        name: '2025 서울 재즈 페스티벌',
        category: '페스티벌',
        location: '올림픽공원',
        dates: { start: '2025-07-20', end: '2025-07-21' },
        lineup: ['Brad Mehldau Trio', 'Kamasi Washington', 'GoGo Penguin'],
        description: '국내외 최정상 재즈 아티스트들이 함께하는 여름 재즈 축제'
      },
      {
        name: 'Coldplay Music Of The Spheres World Tour',
        category: '내한공연',
        location: '고척스카이돔',
        dates: { start: '2025-07-25', end: '2025-07-26' },
        lineup: ['Coldplay'],
        description: '콜드플레이 내한공연'
      },
      {
        name: '락 페스티벌 2025',
        category: '페스티벌',
        location: '난지한강공원',
        dates: { start: '2025-08-02', end: '2025-08-04' },
        lineup: ['데이브레이크', '실리카겔', '넬', '혁오', '쏜애플'],
        description: '한국 인디/록 밴드들의 대축제'
      },
      {
        name: '디뮤지엄 : 모네, 빛을 그리다',
        category: '전시',
        location: '디뮤지엄 성수',
        dates: { start: '2025-07-01', end: '2025-09-30' },
        description: '클로드 모네의 대표작을 미디어아트로 재해석한 몰입형 전시'
      },
      {
        name: '뮤지컬 <오페라의 유령>',
        category: '공연',
        location: '블루스퀘어 신한카드홀',
        dates: { start: '2025-07-15', end: '2025-08-31' },
        description: '전설의 뮤지컬 오페라의 유령 한국 공연'
      },
      {
        name: '2025 월드 DJ 페스티벌',
        category: '페스티벌',
        location: '서울랜드',
        dates: { start: '2025-07-18', end: '2025-07-19' },
        lineup: ['Martin Garrix', 'David Guetta', 'Marshmello', 'Zedd'],
        description: '세계 최정상 DJ들이 펼치는 EDM 축제'
      }
    ];

    console.log('Adding 2025 events...');
    
    for (const event of newEvents) {
      await db.insert(events).values(event);
      console.log(`✅ Added: ${event.name}`);
    }
    
    console.log('\n✅ Successfully added all 2025 events!');
    
    await sql.end();
  } catch (err) {
    console.error('Error adding events:', err);
    await sql.end();
    process.exit(1);
  }
}

add2025Events();