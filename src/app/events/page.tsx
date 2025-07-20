import { Metadata } from 'next';
import { EventsListPage } from '@/modules/events';

export const metadata: Metadata = {
  title: '일정 - few',
  description: '다양한 공연과 페스티벌 일정을 확인하고 기록을 남겨보세요',
};

export default function EventsPage() {
  return <EventsListPage />;
}
