"use client";
import { useCallback, useContext, useEffect, useState } from "react";
import useAxiosPrivate from "../common/util/axios/useAxiosPrivate";
import { createContext } from "react";
import { useAppContext } from "./app-provider";
import { firebaseCloudMessaging } from "../config/firebase";
import * as firebase from "firebase/app";
import { getMessaging, onMessage } from "firebase/messaging";
import { ToastError, ToastInfo } from "../common/util/toast";
import { NotificationContent } from "../config/noti-toast-element";
import { Bell } from "lucide-react";
import moment from "moment";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  data: Notification[];
};

const NotificationContext = createContext<{
  notifications: Notification[];
  markNotificationAsRead?: (notificationId: string, isReadAll: boolean) => void;
}>({
  notifications: [],
  markNotificationAsRead: () => {},
});

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  return context;
};

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notReadNotifications, setNotReadNotifications] = useState<number>(0);
  const axiosPrivate = useAxiosPrivate();
  const { user } = useAppContext();
  const setUpFirebaseMessaging = useCallback(async () => {
    if (!user?.id) return;
    await getNotifications();

    firebaseCloudMessaging
      .init()
      .then(async (token) => {
        if (!token) return;

        await axiosPrivate.patch("/notification/update-fcm-token", {
          fcmToken: token,
        });
      })
      .catch(() => {
        console.error("Failed to initialize notifications");
      });

    if (firebase.getApps().length > 0) {
      try {
        const messaging = getMessaging();
        onMessage(messaging, async (payload) => {
          if (!payload?.notification) {
            console.warn("No notification payload found");
            return;
          }
          const { title, body } = payload?.notification;
          if (title && body) {
            payload?.notification?.body &&
              ToastInfo(NotificationContent(title, body), 6000);
          }

          await getNotifications();
        });
      } catch {
        console.error("Failed to initialize Firebase messaging");
        return null;
      }
    }
  }, [user]);

  const markNotificationAsRead = async (
    notificationId: string,
    isReadAll: boolean = false,
  ) => {
    try {
      await axiosPrivate.patch("/notification/mark-as-read", {
        notificationId,
        isReadAll,
      });

      await getNotifications();
    } catch {
      console.error("Failed to update notification state");
    }
  };

  const getNotifications = async () => {
    if (!user?.id) return;
    try {
      const savedNotifications = await axiosPrivate.get<NotificationsResponse>(
        `/notification`,
        {
          params: {
            page: 1,
            pageSize: 100,
          },
        },
      );
      setNotifications(savedNotifications?.data?.data || notifications);
      setNotReadNotifications(
        savedNotifications?.data?.data.filter((noti) => !noti?.isRead).length,
      );
    } catch (error) {
      ToastError("Failed to get notifications");
    }
  };

  useEffect(() => {
    if (!user) return;

    setUpFirebaseMessaging();
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{ notifications, markNotificationAsRead: markNotificationAsRead }}
    >
      {user && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
          <div className="app-container flex h-[72px] items-center justify-end">
            <div className="pointer-events-auto mr-[6.5rem] sm:mr-[17rem]">
              <Popover placement="bottom-end">
                <PopoverTrigger>
                  <button
                    type="button"
                    className="relative inline-flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-700"
                    aria-label={`Notifications${notReadNotifications ? `, ${notReadNotifications} unread` : ""}`}
                  >
                    <Bell size={20} />
                    {notReadNotifications > 0 && (
                      <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white ring-2 ring-[#f7f7fb]">
                        {notReadNotifications > 99
                          ? "99+"
                          : notReadNotifications}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <div className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="font-bold text-slate-900">
                          Notifications
                        </p>
                        <p className="text-xs text-slate-500">
                          {notReadNotifications} unread
                        </p>
                      </div>
                      {notReadNotifications > 0 && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          onClick={() => markNotificationAsRead("", true)}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notification) => (
                          <button
                            type="button"
                            key={notification.id}
                            className={`flex w-full items-start justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                              !notification.isRead
                                ? "bg-indigo-50/60"
                                : "bg-white"
                            }`}
                            onClick={() => {
                              if (!notification.isRead) {
                                markNotificationAsRead(notification.id, false);
                              }
                            }}
                          >
                            <span className="min-w-0">
                              <span className="line-clamp-1 block text-sm font-bold text-slate-900">
                                {notification.title}
                              </span>
                              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
                                {notification.body}
                              </span>
                            </span>
                            <span className="shrink-0 text-[10px] text-slate-400">
                              {moment(
                                new Date(notification.createdAt),
                              ).fromNow()}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-6 py-10 text-center text-sm text-slate-500">
                          You are all caught up.
                        </div>
                      )}
                    </div>
                    <Link
                      href="/notifications"
                      className="flex min-h-11 items-center justify-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                      View all notifications
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
      {children}
    </NotificationContext.Provider>
  );
}
