"use client";

import { api } from "@/lib/trpc";
import type { Notification } from "@/lib/db/schema";
import Link from "next/link";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const markAsRead = api.notifications.markAsRead.useMutation();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead.mutate({ notificationId: notification.id });
    }
    onClick?.();
  };

  const getNotificationLink = () => {
    if (notification.relatedType === "review" && notification.relatedId) {
      return `/reviews/${notification.relatedId}`;
    }
    if (notification.relatedType === "diary" && notification.relatedId) {
      return `/diary/${notification.relatedId}`;
    }
    if (notification.relatedType === "user" && notification.relatedId) {
      return `/profile/${notification.relatedId}`;
    }
    return "#";
  };

  const getIcon = () => {
    switch (notification.type) {
      case "like":
      case "diary_like":
        return (
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case "comment":
      case "reply":
      case "diary_comment":
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case "follow":
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        );
    }
  };

  return (
    <Link
      href={getNotificationLink()}
      onClick={handleClick}
      className={`block p-4 hover:bg-muted/50 transition-colors ${
        !notification.isRead ? "bg-muted/30" : ""
      }`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        {!notification.isRead && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 bg-primary rounded-full" />
          </div>
        )}
      </div>
    </Link>
  );
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return "방금 전";
}