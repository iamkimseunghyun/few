import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/trpc-server';
import { ProfilePage } from '@/modules/profile/components/ProfilePage';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  
  try {
    const user = await api.users.getById({ id: userId });
    
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

export default async function UserProfilePage({ params }: PageProps) {
  const { userId } = await params;
  
  try {
    const user = await api.users.getById({ id: userId });
    
    if (!user) {
      notFound();
    }
    
    return <ProfilePage profileUserId={userId} />;
  } catch {
    notFound();
  }
}