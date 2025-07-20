import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function ProfileRedirect() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  // 프로필 페이지 대신 인사이트 탭으로 이동
  redirect('/diary?view=insights');
}