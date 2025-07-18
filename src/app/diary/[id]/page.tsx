import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/trpc-server';
import { DiaryDetail } from '@/modules/music-diary/components/DiaryDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const diary = await api.musicDiary.getById({ id });

    return {
      title: `${diary.user?.username || 'Unknown'}의 음악 다이어리 - few`,
      description:
        diary.diary.caption ||
        '음악 공연과 페스티벌의 순간을 기록하고 공유하세요',
    };
  } catch {
    return {
      title: '음악 다이어리 - few',
    };
  }
}

export default async function DiaryDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  try {
    const diary = await api.musicDiary.getById({ id });

    if (!diary) {
      notFound();
    }

    return <DiaryDetail initialData={diary} />;
  } catch {
    notFound();
  }
}
