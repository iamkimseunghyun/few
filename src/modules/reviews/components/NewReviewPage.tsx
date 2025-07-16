'use client';

import { useAuth } from '@clerk/nextjs';
import { redirect, useRouter } from 'next/navigation';
import { ReviewForm } from './ReviewForm';

export function NewReviewPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  if (!isSignedIn) {
    redirect('/sign-in');
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">리뷰 작성</h1>
        <p className="text-gray-600">
          공연이나 페스티벌에 대한 솔직한 경험을 공유해주세요.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ReviewForm 
          onSuccess={() => {
            router.push('/');
          }}
        />
      </div>
    </div>
  );
}