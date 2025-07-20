export const testData = {
  users: {
    testUser: {
      id: 'test-user-123',
      email: 'test@example.com',
      password: 'TestPassword123!',
      username: 'testuser',
    },
    adminUser: {
      id: 'admin-user-123',
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      username: 'admin',
    },
  },
  
  events: {
    festival: {
      id: 'test-festival-123',
      name: '테스트 페스티벌 2024',
      category: 'festival',
      location: '서울 잠실종합운동장',
      description: 'E2E 테스트용 페스티벌입니다.',
      dates: {
        start: '2024-08-01',
        end: '2024-08-03',
      },
    },
    concert: {
      id: 'test-concert-123',
      name: '테스트 콘서트',
      category: 'concert',
      location: '서울 올림픽공원',
      description: 'E2E 테스트용 콘서트입니다.',
      dates: {
        start: '2024-09-15',
        end: '2024-09-15',
      },
    },
  },
  
  reviews: {
    positive: {
      title: '정말 좋았어요!',
      content: '음향도 좋고 무대 구성도 훌륭했습니다. 다음에 또 가고 싶어요.',
      overallRating: 5,
      soundRating: 5,
      viewRating: 4,
      safetyRating: 5,
      operationRating: 4,
    },
    negative: {
      title: '아쉬웠습니다',
      content: '기대했던 것보다 별로였어요. 특히 운영이 미흡했습니다.',
      overallRating: 2,
      soundRating: 3,
      viewRating: 2,
      safetyRating: 3,
      operationRating: 1,
    },
  },
  
  musicDiary: {
    sample: {
      caption: '오늘의 공연 정말 최고였다! 🎵',
      location: '서울 잠실종합운동장',
      media: [
        {
          url: 'https://example.com/test-image.jpg',
          type: 'image' as const,
        },
      ],
    },
  },
};