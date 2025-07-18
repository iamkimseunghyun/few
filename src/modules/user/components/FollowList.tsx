'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/trpc';
import { Button } from '@/modules/shared/ui/components/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface FollowListProps {
  userId: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
}

export function FollowList({ userId, type, isOpen, onClose }: FollowListProps) {
  const { userId: currentUserId } = useAuth();
  const utils = api.useUtils();
  
  const { data, isLoading } = 
    type === 'followers' 
      ? api.user.getFollowers.useQuery(
          { userId, limit: 50 },
          { enabled: isOpen }
        )
      : api.user.getFollowing.useQuery(
          { userId, limit: 50 },
          { enabled: isOpen }
        );
        
  const { mutate: toggleFollow, isPending } = api.user.toggleFollow.useMutation({
    onSuccess: () => {
      // Refetch lists
      utils.user.getFollowers.invalidate();
      utils.user.getFollowing.invalidate();
      utils.user.getProfile.invalidate();
    },
  });
  
  const users = data ?? [];
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md mx-4 max-h-[80vh] bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {type === 'followers' ? '팔로워' : '팔로잉'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* List */}
        <div className="overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              {type === 'followers' ? '아직 팔로워가 없습니다.' : '아직 팔로잉하는 사람이 없습니다.'}
            </div>
          ) : (
            <div className="divide-y">
              {users.map((item) => (
                <div key={item.user.id} className="px-4 py-3 flex items-center justify-between">
                  <Link
                    href={`/profile/${item.user.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      {item.user.imageUrl && (
                        <Image
                          src={item.user.imageUrl}
                          alt={item.user.username}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.user.username}</p>
                      <p className="text-xs text-gray-600">
                        {formatDistanceToNow(new Date(item.followedAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </Link>
                  
                  {currentUserId && currentUserId !== item.user.id && (
                    <Button
                      onClick={() => toggleFollow({ targetUserId: item.user.id })}
                      disabled={isPending}
                      variant={item.isFollowing ? 'outline' : 'default'}
                      size="sm"
                    >
                      {item.isFollowing ? '팔로잉' : '팔로우'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}