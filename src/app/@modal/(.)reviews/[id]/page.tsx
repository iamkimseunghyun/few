'use client';

import { use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Modal } from '@/modules/shared/ui/components/Modal';
import { ReviewModalContent } from '@/modules/reviews/components/ReviewModalContent';

interface ModalPageProps {
  params: Promise<{ id: string }>;
}

export default function InterceptedReviewPage({ params }: ModalPageProps) {
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
      <ReviewModalContent reviewId={id} onClose={handleClose} />
    </Modal>
  );
}