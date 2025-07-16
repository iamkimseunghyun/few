'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { LoadingSpinner, ConfirmModal, useToast } from '@/modules/shared';

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toggleModal, setToggleModal] = useState<{
    isOpen: boolean;
    userId: string;
    username: string;
    isAdmin: boolean;
  }>({ isOpen: false, userId: '', username: '', isAdmin: false });
  const { showToast } = useToast();
  const limit = 20;

  const {
    data: users,
    isLoading,
    refetch,
  } = api.users.getAll.useQuery({
    limit,
    offset: (currentPage - 1) * limit,
    search: searchQuery || undefined,
  });

  const toggleAdmin = api.users.toggleAdmin.useMutation({
    onSuccess: () => {
      refetch();
      setToggleModal({
        isOpen: false,
        userId: '',
        username: '',
        isAdmin: false,
      });
      showToast(
        toggleModal.isAdmin
          ? `${toggleModal.username}님의 관리자 권한을 해제했습니다.`
          : `${toggleModal.username}님을 관리자로 지정했습니다.`,
        'success'
      );
    },
    onError: () => {
      showToast('권한 변경에 실패했습니다.', 'error');
    },
  });

  const handleToggleAdmin = (
    userId: string,
    username: string,
    isAdmin: boolean
  ) => {
    setToggleModal({ isOpen: true, userId, username, isAdmin });
  };

  const confirmToggleAdmin = async () => {
    try {
      await toggleAdmin.mutateAsync({ userId: toggleModal.userId });
    } catch (error) {
      console.error('관리자 권한 변경 실패:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">사용자 관리</h2>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="사용자명으로 검색..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  레벨
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  리뷰 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  권한
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users?.items.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.username || '알 수 없음'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.reviewerLevel === 'seedling' && '🌱 새싹'}
                      {user.reviewerLevel === 'regular' && '🌿 일반'}
                      {user.reviewerLevel === 'expert' && '🌳 전문가'}
                      {user.reviewerLevel === 'master' && '⭐ 마스터'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.reviewCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isAdmin
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.isAdmin ? '관리자' : '일반'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() =>
                        handleToggleAdmin(user.id, user.username, user.isAdmin)
                      }
                      disabled={toggleAdmin.isPending}
                      className={`${
                        user.isAdmin
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-indigo-600 hover:text-indigo-900'
                      } disabled:opacity-50`}
                    >
                      {user.isAdmin ? '권한 해제' : '관리자 지정'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {users && users.items.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-sm text-gray-600">페이지 {currentPage}</span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!users.hasMore}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={toggleModal.isOpen}
        onClose={() =>
          setToggleModal({
            isOpen: false,
            userId: '',
            username: '',
            isAdmin: false,
          })
        }
        onConfirm={confirmToggleAdmin}
        title="권한 변경"
        message={
          toggleModal.isAdmin
            ? `${toggleModal.username}님의 관리자 권한을 해제하시겠습니까?`
            : `${toggleModal.username}님을 관리자로 지정하시겠습니까?`
        }
        confirmText={toggleModal.isAdmin ? '해제' : '지정'}
        cancelText="취소"
        isLoading={toggleAdmin.isPending}
      />
    </div>
  );
}
