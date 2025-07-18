import { Metadata } from 'next';
import { DiaryFeed } from '@/modules/music-diary/components/DiaryFeed';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { auth } from '@clerk/nextjs/server';

export const metadata: Metadata = {
  title: '음악 다이어리 - few',
  description: '음악 공연과 페스티벌의 순간을 기록하고 공유하세요',
};

export default async function DiaryPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">음악 다이어리</h1>
            
            {userId && (
              <Link
                href="/diary/new"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">새 다이어리</span>
              </Link>
            )}
          </div>
        </header>

        {/* Feed */}
        <main>
          <DiaryFeed />
        </main>
        
        {/* Mobile Create Button */}
        {userId && (
          <Link
            href="/diary/new"
            className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 sm:hidden"
          >
            <PlusIcon className="h-6 w-6" />
          </Link>
        )}
      </div>
    </div>
  );
}