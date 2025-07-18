'use client';

import Link from 'next/link';
import { useAuth, useClerk } from '@clerk/nextjs';
import { NotificationBell } from '@/modules/shared/notifications/components/NotificationBell';
import { ThemeToggle } from '@/modules/shared/theme/components/ThemeToggle';
import { SearchBar } from '@/modules/shared/search/components/SearchBar';
import { api } from '@/lib/trpc';

export function Header() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  // 관리자 여부 확인
  const { data: currentUser } = api.users.getCurrentUser.useQuery();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-foreground">
          few
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4">
          <SearchBar />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-4">
          <Link
            href="/events"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            이벤트
          </Link>
          <Link
            href="/diary"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            다이어리
          </Link>
          <Link
            href="/reviews"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            리뷰
          </Link>
          {isSignedIn && (
            <>
              <NotificationBell />
              {currentUser?.isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  관리자
                </Link>
              )}
              <Link
                href="/profile"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                프로필
              </Link>
            </>
          )}
          <ThemeToggle />
          {isSignedIn ? (
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              로그아웃
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              로그인
            </Link>
          )}
        </nav>

        {/* Mobile Navigation - Simplified for bottom nav */}
        <div className="flex items-center gap-2 sm:hidden">
          <SearchBar className="flex-1" />
          {isSignedIn && <NotificationBell />}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
