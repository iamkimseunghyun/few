'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  Home,
  Calendar,
  MessageSquare,
  User,
  Plus,
  Camera,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requireAuth?: boolean;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: '홈',
    icon: Home,
  },
  {
    href: '/events',
    label: '공연',
    icon: Calendar,
  },
  {
    href: '/diary',
    label: '순간',
    icon: Camera,
  },
  {
    href: '/reviews',
    label: '기록',
    icon: MessageSquare,
  },
  {
    href: '/profile',
    label: '마이',
    icon: User,
    requireAuth: true,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  return (
    <>
      {/* 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background sm:hidden">
        <div className="grid grid-cols-5 items-center">
          {navItems.map((item) => {
            if (item.requireAuth && !isSignedIn) return null;

            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={item.href === '/profile' ? 'user-menu-mobile' : undefined}
                className={`flex flex-col items-center justify-center py-2 text-xs transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`h-6 w-6 mb-1 ${isActive ? 'fill-current' : 'stroke-2'}`} />
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
              <div className="relative -mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground">작성</span>
            </Link>
          )}
        </div>
      </nav>

      {/* 하단 여백 - 네비게이션 바 높이만큼 */}
      <div className="h-16 sm:hidden" />
    </>
  );
}
