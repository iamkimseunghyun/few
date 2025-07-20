import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { api } from '@/lib/trpc-server';
import { DiaryDetailView } from '@/modules/music-diary/components/DiaryDetailView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const diary = await api.musicDiary.getById({ id });

    const title = diary.diary.caption 
      ? `${diary.diary.caption.slice(0, 50)}${diary.diary.caption.length > 50 ? '...' : ''} - few`
      : '나의 순간 - few';

    return {
      title,
      description: diary.diary.caption || '음악 공연의 순간을 기록한 일기',
    };
  } catch {
    return {
      title: '순간 - few',
    };
  }
}

export default async function DiaryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();
  
  try {
    const diary = await api.musicDiary.getById({ id });

    if (!diary) {
      notFound();
    }

    // Check if user can view this diary
    const isOwner = userId === diary.diary.userId;
    const isPublic = diary.diary.isPublic;

    if (!isPublic && !isOwner) {
      notFound();
    }

    // Add isLiked and isSaved to diary data
    const diaryWithInteractions = {
      ...diary.diary,
      isLiked: diary.isLiked,
      isSaved: diary.isSaved,
    };

    return <DiaryDetailView diary={diaryWithInteractions} user={diary.user} event={null} isOwner={isOwner} />;
  } catch {
    notFound();
  }
}