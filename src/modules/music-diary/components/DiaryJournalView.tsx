'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/trpc';
import { DiaryCalendarView } from './DiaryCalendarView';
import { DiaryTimelineView } from './DiaryTimelineView';
import { DiaryInsights } from './DiaryInsights';
import { DiaryEntryModal } from './DiaryEntryModal';
import { ProfilePage } from '@/modules/profile/components/ProfilePage';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { 
  CalendarIcon, 
  ClockIcon,
  ChartBarIcon,
  PlusIcon,
  Cog6ToothIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import type { musicDiaries } from '@/lib/db/schema';
import { ko } from 'date-fns/locale';

type ViewMode = 'calendar' | 'timeline' | 'insights' | 'profile';

export function DiaryJournalView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL에서 초기 모드와 사용자 ID 가져오기
  const getInitialMode = (): ViewMode => {
    const mode = searchParams.get('view') as ViewMode;
    if (mode && ['calendar', 'timeline', 'insights', 'profile'].includes(mode)) {
      return mode;
    }
    return 'timeline';
  };
  
  const getUserIdFromUrl = (): string | null => {
    return searchParams.get('userId');
  };
  
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialMode());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(getUserIdFromUrl());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showNewEntry, setShowNewEntry] = useState(false);

  // URL 변경 감지
  useEffect(() => {
    const mode = searchParams.get('view') as ViewMode;
    const userId = searchParams.get('userId');
    
    if (mode && ['calendar', 'timeline', 'insights', 'profile'].includes(mode)) {
      setViewMode(mode);
    }
    
    setSelectedUserId(userId);
  }, [searchParams]);

  const { userId: currentUserId } = useAuth();

  // 선택된 사용자 정보 가져오기
  const { data: selectedUser } = api.users.getById.useQuery(
    { id: selectedUserId! },
    { enabled: !!selectedUserId && viewMode === 'profile' }
  );

  // 사용자의 모든 다이어리 데이터 가져오기
  const { data: myDiariesData, isLoading: myDiariesLoading, refetch: refetchMyDiaries } = api.musicDiary.getMyDiaries.useQuery({
    includePrivate: true,
  }, {
    enabled: !!currentUserId && !selectedUserId && (viewMode === 'insights' || viewMode === 'calendar' || viewMode === 'timeline'),
  });

  // 다른 사용자의 다이어리 데이터 가져오기
  const { data: userDiariesData, isLoading: userDiariesLoading, refetch: refetchUserDiaries } = api.musicDiary.getUserDiaries.useQuery({
    userId: selectedUserId || '',
  }, {
    enabled: !!selectedUserId,
  });

  const diariesData = selectedUserId ? userDiariesData : myDiariesData;
  const isLoading = selectedUserId ? userDiariesLoading : myDiariesLoading;
  const refetch = selectedUserId ? refetchUserDiaries : refetchMyDiaries;

  type DiaryWithRelations = typeof musicDiaries.$inferSelect & {
    user?: { imageUrl: string | null; username: string | null } | null;
    event?: { name: string } | null;
  };
  
  const diaries = diariesData as DiaryWithRelations[] | undefined;

  // URL 업데이트 함수
  const updateUrl = (mode: ViewMode, userId?: string | null) => {
    const params = new URLSearchParams();
    params.set('view', mode);
    
    // 프로필 모드가 아니면 userId 제거
    if (mode === 'profile' && userId) {
      params.set('userId', userId);
    }
    
    router.push(`/diary?${params.toString()}`);
  };

  const viewComponents = {
    calendar: <DiaryCalendarView diaries={diaries || []} selectedDate={selectedDate} onDateSelect={setSelectedDate} />,
    timeline: <DiaryTimelineView diaries={diaries || []} />,
    insights: currentUserId && !selectedUserId ? <DiaryInsights diaries={diaries || []} /> : null,
    profile: selectedUserId ? <ProfilePage profileUserId={selectedUserId} /> : null
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고/타이틀 */}
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {viewMode === 'profile' && selectedUser ? `${selectedUser.username}의 순간` : '나의 순간'}
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
              </span>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewEntry(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="hidden sm:inline">새 순간</span>
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 네비게이션 탭 */}
          <div className="flex items-center">
            <nav className="flex gap-1">
              <button
                onClick={() => updateUrl('timeline')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  viewMode === 'timeline'
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  타임라인
                </div>
                {viewMode === 'timeline' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
                )}
              </button>
              <button
                onClick={() => updateUrl('calendar')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  viewMode === 'calendar'
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  캘린더
                </div>
                {viewMode === 'calendar' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
                )}
              </button>
              {currentUserId && (
                <button
                  onClick={() => updateUrl('insights')}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    viewMode === 'insights' 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4" />
                    인사이트
                  </div>
                  {viewMode === 'insights' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
                  )}
                </button>
              )}
              {currentUserId && (
                <button
                  onClick={() => updateUrl('profile', currentUserId)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    viewMode === 'profile' && selectedUserId === currentUserId
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCircleIcon className="w-4 h-4" />
                    내 프로필
                  </div>
                  {viewMode === 'profile' && selectedUserId === currentUserId && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
                  )}
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">로딩 중...</div>
          </div>
        ) : viewMode === 'profile' && selectedUserId ? (
          <ProfilePage profileUserId={selectedUserId} />
        ) : viewMode === 'insights' && currentUserId && !selectedUserId ? (
          <DiaryInsights diaries={diaries || []} />
        ) : (
          viewComponents[viewMode]
        )}
      </main>

      {/* 새 순간 작성 모달 */}
      {showNewEntry && (
        <DiaryEntryModal 
          onClose={() => setShowNewEntry(false)}
          onSuccess={() => {
            setShowNewEntry(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}