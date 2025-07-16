import { ReviewDetailPage } from "@/modules/reviews";

export default function ReviewDetail({ params }: { params: { id: string } }) {
  return <ReviewDetailPage reviewId={params.id} />;
}