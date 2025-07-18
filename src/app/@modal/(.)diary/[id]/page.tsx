'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { Modal } from '@/modules/shared/ui/components/Modal';
import { DiaryModalContent } from '@/modules/music-diary/components/DiaryModalContent';

interface ModalPageProps {
  params: Promise<{ id: string }>;
}

export default function InterceptedDiaryPage({ params }: ModalPageProps) {
  const { id } = use(params);
  
  // "new" ID는 인터셉팅하지 않고 실제 페이지로 이동
  if (id === 'new') {
    notFound();
  }
  
  return (
    <Modal>
      <DiaryModalContent diaryId={id} />
    </Modal>
  );
}