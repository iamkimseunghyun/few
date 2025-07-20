import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DiaryJournalView } from '@/modules/music-diary/components/DiaryJournalView';

export const metadata: Metadata = {
  title: '나의 순간 - few',
  description: '나만의 음악 일기장, 공연과 페스티벌의 추억을 기록하세요',
};

export default async function DiaryPage() {
  const { userId } = await auth();

  // 로그인하지 않은 사용자는 로그인 페이지로
  if (!userId) {
    redirect('/sign-in?redirect_url=/diary');
  }

  return <DiaryJournalView />;
}