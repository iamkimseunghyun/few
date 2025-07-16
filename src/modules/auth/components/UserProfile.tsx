"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function UserProfile() {
  return (
    <Link
      href="/profile"
      className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 transition-colors hover:bg-gray-50"
    >
      <UserButton afterSignOutUrl="/" />
      <span className="text-sm font-medium text-gray-700">
        내 프로필
      </span>
    </Link>
  );
}