import { EditReviewPage } from "@/modules/reviews/components/EditReviewPage";

interface EditReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: EditReviewPageProps) {
  const { id } = await params;
  return <EditReviewPage reviewId={id} />;
}