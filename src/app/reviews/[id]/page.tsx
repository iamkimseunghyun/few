import { ReviewDetailPage } from '@/modules/reviews';

export default async function ReviewDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReviewDetailPage reviewId={id} />;
}
