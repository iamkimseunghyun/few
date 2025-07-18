'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import * as Sentry from '@sentry/nextjs';

export function SentryUserContext() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // 사용자 정보 설정 (이메일 제외)
        Sentry.setUser({
          id: user.id,
          username: user.username || undefined,
        });

        // 추가 컨텍스트 설정
        Sentry.setContext('user_metadata', {
          created_at: user.createdAt,
          has_image: !!user.imageUrl,
          primary_email_verified: user.primaryEmailAddress?.verification?.status === 'verified',
        });
      } else {
        // 로그아웃 시 사용자 정보 제거
        Sentry.setUser(null);
      }
    }
  }, [user, isLoaded]);

  return null;
}