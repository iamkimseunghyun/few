import dynamic from 'next/dynamic';

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
  </div>
);

// 실제로 존재하는 무거운 컴포넌트들의 동적 import 목록
export const DynamicComponents = {
  // Named export
  ReviewForm: dynamic(
    () =>
      import('@/modules/reviews/components/ReviewForm').then((mod) => ({
        default: mod.ReviewForm,
      })),
    { loading: LoadingSpinner }
  ),

  EventForm: dynamic(
    () =>
      import('@/modules/events/components/EventForm').then((mod) => ({
        default: mod.EventForm,
      })),
    { loading: LoadingSpinner }
  ),

  // Default export
  EventCalendar: dynamic(
    () => import('@/modules/events/components/EventCalendar'),
    { loading: LoadingSpinner }
  ),

  AdminDashboard: dynamic(
    () => import('@/modules/admin/components/AdminDashboard'),
    { loading: LoadingSpinner }
  ),
};
