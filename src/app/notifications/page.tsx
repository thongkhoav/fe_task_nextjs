"use client";

import moment from "moment";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";

import { useNotificationContext } from "../providers/notification-provider";
import { EmptyState } from "@/components/app/page-state";

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead } = useNotificationContext();
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <main className="app-container w-full py-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/rooms" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700">
            <ArrowLeft size={16} /> Back to rooms
          </Link>
          <p className="text-sm font-semibold text-indigo-600">Inbox</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Notifications</h1>
          <p className="mt-2 text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread updates need your attention.` : "You are up to date."}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => markNotificationAsRead?.("", true)}
          >
            <CheckCheck size={17} /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="surface-card divide-y divide-slate-100 overflow-hidden">
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              className={`flex w-full items-start gap-4 p-4 text-left transition hover:bg-slate-50 sm:p-6 ${
                !notification.isRead ? "bg-indigo-50/50" : "bg-white"
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  markNotificationAsRead?.(notification.id, false);
                }
              }}
            >
              <span className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${!notification.isRead ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                <Bell size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <span className="font-bold text-slate-900">{notification.title}</span>
                  <time className="shrink-0 text-xs text-slate-400" dateTime={notification.createdAt}>
                    {moment(new Date(notification.createdAt)).fromNow()}
                  </time>
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-500">{notification.body}</span>
              </span>
              {!notification.isRead && <span className="mt-2 size-2 shrink-0 rounded-full bg-indigo-600" aria-label="Unread" />}
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="No notifications" description="Updates about tasks, rooms, and reminders will appear here." />
      )}
    </main>
  );
}
