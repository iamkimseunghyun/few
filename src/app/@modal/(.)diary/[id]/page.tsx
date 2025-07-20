'use client';

import { use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Modal } from '@/modules/shared/ui/components/Modal';
import { DiaryModalContent } from '@/modules/music-diary/components/DiaryModalContent';
import '@/modules/shared/ui/styles/modal-animations.css';

interface ModalPageProps {
  params: Promise<{ id: string }>;
}

export default function InterceptedDiaryPage({ params }: ModalPageProps) {
  const { id } = use(params);
  const router = useRouter();
  
  // "new" ID는 인터셉팅하지 않고 실제 페이지로 이동
  if (id === 'new') {
    notFound();
  }
  
  const handleClose = () => {
    router.back();
  };
  
  return (
    <Modal>
      <DiaryModalContent diaryId={id} onClose={handleClose} />
    </Modal>
  );
}