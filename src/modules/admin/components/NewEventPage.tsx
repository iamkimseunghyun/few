'use client';

import { useAuth } from '@clerk/nextjs';
import { redirect, useRouter } from 'next/navigation';
import { EventForm } from '@/modules/events';
import { api } from '@/lib/trpc';

import { useEffect } from 'react';
import { LoadingSpinner } from '@/modules/shared';

export function NewEventPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } =
    api.users.getCurrentUser.useQuery(undefined, { enabled: isSignedIn });

  useEffect(() => {
    if (!userLoading && (!currentUser || !currentUser.isAdmin)) {
      redirect('/');
    }
  }, [currentUser, userLoading]);

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">새 이벤트 추가</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <EventForm
          onSuccess={() => {
            router.push('/admin');
          }}
          onCancel={() => {
            router.push('/admin');
          }}
        />
      </div>
    </div>
  );
}
