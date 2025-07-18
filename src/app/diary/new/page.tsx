import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { CreateDiaryForm } from '@/modules/music-diary/components/CreateDiaryForm';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: '새 음악 다이어리 작성 - few',
  description: '음악 공연과 페스티벌의 순간을 기록하세요',
};

export default async function NewDiaryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in?redirect=/diary/new');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b">
          <div className="px-4 py-3 flex items-center gap-4">
            <Link
              href="/diary"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">새 음악 다이어리</h1>
          </div>
        </header>

        {/* Form */}
        <main className="p-4">
          <CreateDiaryForm />
        </main>
      </div>
    </div>
  );
}