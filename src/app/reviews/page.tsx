import { Metadata } from 'next';
import { ReviewsListPage } from "@/modules/reviews/components/ReviewsListPage";

export const metadata: Metadata = {
  title: '기록 - few',
  description: '다양한 공연과 페스티벌에 대한 생생한 기록들을 만나보세요',
};

export default function ReviewsPage() {
  return <ReviewsListPage />;
}
