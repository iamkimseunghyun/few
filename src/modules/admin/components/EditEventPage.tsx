"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/trpc";
import { EventForm } from "@/modules/events";
import { useEffect } from "react";

export function EditEventPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const { data: currentUser, isLoading: userLoading } = api.users.getCurrentUser.useQuery(
    undefined,
    { enabled: isSignedIn }
  );

  useEffect(() => {
    if (!userLoading && (!currentUser || !currentUser.isAdmin)) {
      router.push("/");
    }
  }, [currentUser, userLoading, router]);

  const { data: event, isLoading } = api.events.getById.useQuery({
    id: eventId,
  });

  if (userLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      </div>
    );
  }
  
  if (!currentUser?.isAdmin) {
    return null;
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            이벤트를 찾을 수 없습니다
          </h2>
          <button
            onClick={() => router.push("/admin")}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            관리자 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">이벤트 수정</h1>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <EventForm
          event={{
            id: event.id,
            name: event.name,
            category: event.category || "페스티벌", // null인 경우 기본값 설정
            location: event.location || undefined,
            dates: event.dates || undefined,
            description: event.description || undefined,
            lineup: event.lineup || undefined,
            posterUrl: event.posterUrl || undefined,
            ticketPriceRange: event.ticketPriceRange || undefined,
            capacity: event.capacity || undefined,
            organizer: event.organizer || undefined,
            website: event.website || undefined,
          }}
          onSuccess={() => {
            router.push("/admin");
          }}
          onCancel={() => {
            router.push("/admin");
          }}
        />
      </div>
    </div>
  );
}