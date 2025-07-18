import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/trpc-server';
import { EditDiaryForm } from '@/modules/music-diary/components/EditDiaryForm';
import { auth } from '@clerk/nextjs/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await params; // Await to satisfy async function requirement

  return {
    title: '다이어리 수정 - few',
    description: '음악 다이어리를 수정하세요',
  };
}

export default async function EditDiaryPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  try {
    const diary = await api.musicDiary.getById({ id });

    if (!diary || diary.diary.userId !== userId) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="text-2xl font-bold mb-6">다이어리 수정</h1>
          <EditDiaryForm diary={diary.diary} />
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
