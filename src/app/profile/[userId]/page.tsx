import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/trpc-server';
import { UserProfile } from '@/modules/user/components/UserProfile';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  
  try {
    const user = await api.user.getById({ id: userId });
    
    return {
      title: `${user.username} - few`,
      description: `${user.username}의 프로필`,
    };
  } catch {
    return {
      title: '사용자 프로필 - few',
      description: '사용자 프로필',
    };
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { userId } = await params;
  
  try {
    const user = await api.user.getById({ id: userId });
    
    if (!user) {
      notFound();
    }
    
    return <UserProfile userId={userId} />;
  } catch {
    notFound();
  }
}