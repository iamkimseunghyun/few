import { users, events, reviews, reviewLikes, comments } from '@/lib/db/schema';
import { db } from '@/lib/db/server';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️ Clearing existing test data...');
    await db.delete(comments).where(() => true);
    await db.delete(reviewLikes).where(() => true);
    await db.delete(reviews).where(() => true);
    await db.delete(events).where(() => true);
    await db.delete(users).where(() => true);

    // Insert test users
    console.log('📝 Inserting users...');
    await db.insert(users).values([
      {
        id: 'test_user_1',
        username: 'testuser',
        imageUrl:
          'https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18yb1o0OXJXRzdBdUhWUGJUdGtqUUJuZWh6ZVMiLCJyaWQiOiJ1c2VyXzJvWjdSa2J4U1Z3dFZYc2lSS0JXaGRqNWdRSiIsImluaXRpYWxzIjoiSlMifQ',
      },
      {
        id: 'test_user_2',
        username: 'musicfan',
        imageUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
      },
    ]);
    console.log('✅ Users inserted');

    // Insert test events
    console.log('📝 Inserting events...');
    await db.insert(events).values([
      {
        id: 'test_event_1',
        name: '2024 Seoul Music Festival',
        category: 'music',
        location: 'Seoul Olympic Stadium',
        dates: {
          start: '2024-07-15',
          end: '2024-07-17',
        },
        lineup: ['IU', 'BTS', 'NewJeans', 'Seventeen'],
        posterUrl:
          'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop',
        venueInfo: {
          name: 'Olympic Stadium',
          capacity: 70000,
          sections: ['A', 'B', 'C', 'VIP'],
        },
      },
      {
        id: 'test_event_2',
        name: 'Rock in Seoul 2024',
        category: 'rock',
        location: 'Jamsil Arena',
        dates: {
          start: '2024-08-20',
          end: '2024-08-21',
        },
        lineup: ['Radiohead', 'Arctic Monkeys', 'The Strokes'],
        posterUrl:
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
        venueInfo: {
          name: 'Jamsil Arena',
          capacity: 15000,
          sections: ['Floor', 'Lower', 'Upper'],
        },
      },
      {
        id: 'test_event_3',
        name: 'Ultra Korea 2024',
        category: 'edm',
        location: 'Seoul Olympic Stadium',
        dates: {
          start: '2024-06-10',
          end: '2024-06-12',
        },
        lineup: ['Martin Garrix', 'David Guetta', 'Zedd', 'Marshmello'],
        posterUrl:
          'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?w=800&h=400&fit=crop',
        venueInfo: {
          name: 'Olympic Stadium',
          capacity: 60000,
          sections: ['GA', 'VIP', 'VVIP'],
        },
      },
    ]);
    console.log('✅ Events inserted');

    // Insert test reviews
    console.log('📝 Inserting reviews...');
    await db.insert(reviews).values([
      {
        id: 'test_review_1',
        eventId: 'test_event_1',
        userId: 'test_user_1',
        overallRating: 5,
        soundRating: 5,
        viewRating: 4,
        safetyRating: 5,
        operationRating: 5,
        seatOrArea: 'A구역 15열',
        content:
          '정말 최고의 페스티벌이었습니다! 라인업도 훌륭했고, 운영도 매끄러웠어요. 특히 음향이 정말 좋았습니다.',
        tags: ['음향좋음', '빠른입장', '화장실깨끗'],
        imageUrls: [
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
        ],
      },
      {
        id: 'test_review_2',
        eventId: 'test_event_2',
        userId: 'test_user_2',
        overallRating: 4,
        soundRating: 5,
        viewRating: 3,
        safetyRating: 4,
        operationRating: 4,
        seatOrArea: '스탠딩 중앙',
        content:
          '록 팬이라면 꼭 가야할 페스티벌! 라인업이 정말 좋았어요. 다만 시야가 조금 아쉬웠습니다.',
        tags: ['라인업최고', '음향좋음', '시야아쉬움'],
        imageUrls: [],
      },
      {
        id: 'test_review_3',
        eventId: 'test_event_3',
        userId: 'test_user_1',
        overallRating: 5,
        soundRating: 5,
        viewRating: 5,
        safetyRating: 4,
        operationRating: 5,
        seatOrArea: 'VIP Zone',
        content:
          'EDM 팬들의 천국! 3일 내내 즐거웠어요. VIP 구역은 정말 가성비가 좋았습니다.',
        tags: ['음향최고', 'VIP추천', '분위기좋음'],
        imageUrls: [
          'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=600&h=400&fit=crop',
          'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&h=400&fit=crop',
        ],
      },
    ]);
    console.log('✅ Reviews inserted');

    // Insert some likes
    console.log('📝 Inserting likes...');
    await db.insert(reviewLikes).values([
      {
        id: 'like_1',
        reviewId: 'test_review_1',
        userId: 'test_user_2',
      },
      {
        id: 'like_2',
        reviewId: 'test_review_2',
        userId: 'test_user_1',
      },
    ]);
    console.log('✅ Likes inserted');

    // Insert some comments
    console.log('📝 Inserting comments...');
    await db.insert(comments).values([
      {
        id: 'comment_1',
        reviewId: 'test_review_1',
        userId: 'test_user_2',
        content: '저도 정말 좋았어요! 내년에도 꼭 가고 싶네요.',
      },
      {
        id: 'comment_2',
        reviewId: 'test_review_2',
        userId: 'test_user_1',
        content: '라인업 정말 대박이었죠!',
      },
    ]);
    console.log('✅ Comments inserted');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 2 users created');
    console.log('  - 3 events created');
    console.log('  - 3 reviews created');
    console.log('  - 2 likes created');
    console.log('  - 2 comments created');
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();