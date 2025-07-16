"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { NotificationBell } from "@/modules/shared/notifications/components/NotificationBell";
import { ThemeToggle } from "@/modules/shared/theme/components/ThemeToggle";
import { SearchBar } from "@/modules/shared/search/components/SearchBar";
import { api } from "@/lib/trpc";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 sm:hidden">
          {isSignedIn && <NotificationBell />}
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-background sm:hidden">
          {/* Mobile Search Bar */}
          <div className="p-4">
            <SearchBar />
          </div>
          <nav className="flex flex-col px-4 pb-2">
            {isSignedIn && (
              <>
                {currentUser?.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    관리자
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  프로필
                </Link>
              </>
            )}
            {isSignedIn ? (
              <button
                onClick={() => {
                  signOut({ redirectUrl: '/' });
                  setIsMobileMenuOpen(false);
                }}
                className="py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/sign-in"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}