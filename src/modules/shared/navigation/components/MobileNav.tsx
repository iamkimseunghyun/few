'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  HomeIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CalendarIcon as CalendarIconSolid,
  ChatBubbleLeftIcon as ChatBubbleLeftIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconActive: React.ComponentType<{ className?: string }>;
  requireAuth?: boolean;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: '홈',
    icon: HomeIcon,
    iconActive: HomeIconSolid,
  },
  {
    href: '/events',
    label: '이벤트',
    icon: CalendarIcon,
    iconActive: CalendarIconSolid,
  },
  {
    href: '/reviews',
    label: '리뷰',
    icon: ChatBubbleLeftIcon,
    iconActive: ChatBubbleLeftIconSolid,
  },
  {
    href: '/profile',
    label: '마이',
    icon: UserIcon,
    iconActive: UserIconSolid,
    requireAuth: true,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  return (
    <>
      {/* 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden">
        <div className="grid grid-cols-5 items-center">
          {navItems.map((item) => {
            if (item.requireAuth && !isSignedIn) return null;

            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = isActive ? item.iconActive : item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 text-xs ${
                  isActive ? 'text-purple-600' : 'text-gray-500'
                }`}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}

          {/* 중앙 플로팅 버튼 - 리뷰 작성 */}
          {isSignedIn && (
            <Link
              href="/reviews/new"
              className="flex flex-col items-center justify-center"
            >
              <div className="relative -mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg">
                <PlusIcon className="h-6 w-6" />
              </div>
              <span className="mt-1 text-[10px] text-gray-500">작성</span>
            </Link>
          )}
        </div>
      </nav>

      {/* 하단 여백 - 네비게이션 바 높이만큼 */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
