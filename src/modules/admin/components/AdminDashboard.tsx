'use client';

import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/trpc';
import Image from 'next/image';

import { useEffect, useState } from 'react';
import { UserManagement } from './UserManagement';
import { LoadingSpinner, ConfirmModal, useToast } from '@/modules/shared';

export function AdminDashboard() {
  const { isSignedIn } = useAuth();
  const { data: currentUser, isLoading: userLoading } =
    api.users.getCurrentUser.useQuery(undefined, { enabled: isSignedIn });
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'events' | 'users'>('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventName: string;
  }>({ isOpen: false, eventId: '', eventName: '' });
  const limit = 10;

  useEffect(() => {
    if (!userLoading && (!currentUser || !currentUser.isAdmin)) {
      redirect('/');
    }
  }, [currentUser, userLoading]);

  const {
    data: events,
    isLoading,
    refetch,
  } = api.events.getAll.useQuery({
    limit,
    cursor: String((currentPage - 1) * limit),
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
  });

  const deleteEvent = api.events.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteModal({ isOpen: false, eventId: '', eventName: '' });
      showToast('이벤트가 삭제되었습니다.', 'success');
    },
    onError: () => {
      showToast('이벤트 삭제에 실패했습니다.', 'error');
    },
  });

  const updateBestReviews = api.reviewsEnhanced.updateBestReviews.useMutation({
    onSuccess: (data) => {
      showToast(`베스트 리뷰가 업데이트되었습니다. (총 ${data.updated}개)`, 'success');
    },
    onError: () => {
      showToast('베스트 리뷰 업데이트에 실패했습니다.', 'error');
    },
  });

  // 카테고리 목록
  const categories = [
    { value: '', label: '전체' },
    { value: '페스티벌', label: '페스티벌' },
    { value: '콘서트', label: '콘서트' },
    { value: '내한공연', label: '내한공연' },
    { value: '공연', label: '공연' },
    { value: '전시', label: '전시' },
  ];

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return null;
  }

  const handleDelete = (eventId: string, eventName: string) => {
    setDeleteModal({ isOpen: true, eventId, eventName });
  };

  const confirmDelete = async () => {
    try {
      await deleteEvent.mutateAsync({ id: deleteModal.eventId });
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">관리자 페이지</h1>

      {/* 탭 네비게이션 */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('events')}
            className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
              activeTab === 'events'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            이벤트 관리
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            사용자 관리
          </button>
        </nav>
      </div>

      {activeTab === 'events' ? (
        <>
          <div className="mb-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                이벤트 관리
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateBestReviews.mutate()}
                  disabled={updateBestReviews.isPending}
                  className="rounded-lg bg-yellow-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-yellow-700 disabled:opacity-50"
                >
                  {updateBestReviews.isPending
                    ? '업데이트 중...'
                    : '🏆 베스트 리뷰 업데이트'}
                </button>
                <Link
                  href="/admin/events/new"
                  className="rounded-lg bg-gray-900 px-6 py-2.5 font-medium text-white transition-colors hover:bg-gray-800"
                >
                  이벤트 추가
                </Link>
              </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="이벤트명 또는 장소 검색..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:outline-none"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  이벤트 관리
                </h2>
                {events && (
                  <p className="text-sm text-gray-600">
                    총 {events.items.length}개 이벤트
                    {events.nextCursor && ' +'}
                  </p>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {events && events.items && events.items.length > 0 ? (
                  events.items.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-6">
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                        {event.posterUrl ? (
                          <Image
                            src={event.posterUrl}
                            alt={event.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <svg
                              className="h-8 w-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {event.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                          {event.category && (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                              {event.category}
                            </span>
                          )}
                          {event.location && <span>{event.location}</span>}
                          {event.dates && (
                            <span>
                              {new Date(event.dates.start).toLocaleDateString(
                                'ko-KR'
                              )}
                            </span>
                          )}
                          {event.reviewCount > 0 && (
                            <span className="text-xs text-gray-500">
                              리뷰 {event.reviewCount}개
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id, event.name)}
                          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex min-h-[40vh] items-center justify-center">
                    <p className="text-gray-600">
                      {searchQuery || selectedCategory
                        ? '검색 결과가 없습니다.'
                        : '등록된 이벤트가 없습니다.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 페이지네이션 */}
            {events && events.items.length > 0 && (
              <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  이전
                </button>
                <span className="text-sm text-gray-600">
                  페이지 {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!events.nextCursor}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <UserManagement />
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, eventId: '', eventName: '' })}
        onConfirm={confirmDelete}
        title="이벤트 삭제"
        message={`"${deleteModal.eventName}" 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        isLoading={deleteEvent.isPending}
      />
    </div>
  );
}
