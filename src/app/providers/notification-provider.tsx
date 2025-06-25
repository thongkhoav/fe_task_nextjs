"use client";
import { use, useContext, useEffect, useState } from "react";
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
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@nextui-org/react";
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
  const { user, tokens } = useAppContext();
  const setUpFirebaseMessaging = async () => {
    if (!user?.sub || !tokens?.refresh_token) return;
    await getNotifications();

    firebaseCloudMessaging
      .init()
      .then(async (token) => {
        console.log("FCM Token:", token);
        // Send this token to your server if needed

        await axiosPrivate.patch("/notification/update-fcm-token", {
          fcmToken: token,
          userId: user?.sub,
          refreshToken: tokens?.refresh_token,
        });
        console.log("FCM Token sent to server");
      })
      .catch((error) => {
        console.error("Failed to initialize FCM:", error);
      });

    if (firebase.getApps().length > 0) {
      try {
        const messaging = getMessaging();
        onMessage(messaging, async (payload) => {
          console.log("Message Received", payload);
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
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  };

  const markNotificationAsRead = async (
    notificationId: string,
    isReadAll: boolean = false
  ) => {
    try {
      console.log("read noti", {
        notificationId,
        isReadAll,
      });

      await axiosPrivate.patch("/notification/mark-as-read", {
        notificationId,
        isReadAll,
      });

      await getNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const getNotifications = async () => {
    if (!user?.sub) return;
    try {
      const savedNotifications = await axiosPrivate.get<NotificationsResponse>(
        `/notification`,
        {
          params: {
            page: 1,
            pageSize: 100,
          },
        }
      );
      setNotifications(savedNotifications?.data?.data || notifications);
      setNotReadNotifications(
        savedNotifications?.data?.data.filter((noti) => !noti?.isRead).length
      );
      console.log("Notifications:", savedNotifications?.data?.data);
    } catch (error) {
      ToastError("Failed to get notifications");
    }
  };

  useEffect(() => {
    console.log("User in noti:", user);

    setUpFirebaseMessaging();
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{ notifications, markNotificationAsRead: markNotificationAsRead }}
    >
      {user && (
        <div className="w-full flex justify-center mt-5">
          <div className="flex justify-between gap-5 px-5 min-w-80 py-2 bg-slate-200 rounded-md">
            <Link
              href="/notifications"
              className="text-lg font-bold flex items-center gap-1 cursor-pointer"
              passHref
            >
              <Tooltip content="View more">
                <p>Notifications</p>
              </Tooltip>
            </Link>
            {notifications.length > 0 && (
              <Popover placement="right">
                <Badge content={notReadNotifications} color="danger">
                  <PopoverTrigger>
                    <Bell
                      size={25}
                      className="cursor-pointer hover:opacity-85"
                    />
                  </PopoverTrigger>
                </Badge>
                <PopoverContent>
                  <div>
                    {notifications.filter((noti) => !noti?.isRead).length >
                      0 && (
                      <p className="flex justify-end mb-2">
                        <span
                          className="text-sm font-bold cursor-pointer"
                          onClick={() => {
                            markNotificationAsRead("", true);
                          }}
                        >
                          Mark all as read
                        </span>
                      </p>
                    )}
                    <div className="flex flex-col min-w-72 max-w-[400px] py-2">
                      {notifications.map((notification, index) => (
                        <div key={notification.id}>
                          <div
                            className={`flex justify-between gap-5 ${
                              !notification?.isRead &&
                              "bg-gray-100 hover:bg-white"
                            } cursor-pointer`}
                            onClick={() => {
                              if (!notification.isRead) {
                                markNotificationAsRead(notification.id, false);
                              }
                            }}
                          >
                            <div className="flex flex-col gap-2">
                              <div className="text-base font-bold line-clamp-2">
                                {notification.title}
                              </div>
                              <div className="text-sm">{notification.body}</div>
                            </div>
                            <div className="text-sm line-clamp-2">
                              {moment(
                                new Date(notification.createdAt)
                              ).fromNow()}
                            </div>
                          </div>
                          {index < notifications.length - 1 && (
                            <div className="h-[2px] bg-gray-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      )}
      {children}
    </NotificationContext.Provider>
  );
}
