"use client";

import { loginApi, TokenPair } from "@/apiRequests/auth/login.api";
import { HeroUIProvider, Tooltip } from "@heroui/react";
import { use, useCallback, useContext, useEffect, useState } from "react";

import { createContext } from "react";
import { jwtDecode } from "jwt-decode";
import ToastProvider from "./toast-provider";
import { clearCookieLocal, setCookieLocal } from "../common/util/cookie-action";
import useAxiosPrivate from "../common/util/axios/useAxiosPrivate";
import { ToastError, ToastInfo, ToastSuccess } from "../common/util/toast";
import { CircleUserRound, LogOut, UserRound } from "lucide-react";

import { useRouter } from "next/navigation";
import { firebaseCloudMessaging } from "../config/firebase";
import { getMessaging, onMessage } from "firebase/messaging";
import { NotificationContent } from "../config/noti-toast-element";
import { log } from "console";
import NotificationProvider from "./notification-provider";
import getAuthentication from "../(auth)/actions/get-authentication";
import { socket } from "../socket/socket";
import axios from "axios";

export enum RoleType {
  ADMIN = "ADMIN",
  USER = "USER",
}

type User = {
  sub: string;
  email: string;
  fullName: string;
  role: RoleType;
};

const AppContext = createContext<{
  user: User | null;
  tokens: TokenPair | null;
  setUser: (user: TokenPair | null) => void;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}>({
  user: null,
  tokens: null,
  setUser: () => {},
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

export const useAppContext = () => {
  const context = useContext(AppContext);
  return context;
};

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUserState] = useState<User | null>(() => {
    // if (isClient()) {
    //   const _user = localStorage.getItem('user')
    //   return _user ? JSON.parse(_user) : null
    // }
    return null;
  });
  const [tokens, setTokens] = useState<TokenPair | null>(null);
  const isAuthenticated = Boolean(user);
  const axiosPrivate = useAxiosPrivate();
  const router = useRouter();

  const setUser = useCallback((tokens: TokenPair | null) => {
    if (tokens) {
      // localStorage.setItem("task_user", JSON.stringify(tokens));
      const decodedToken: any = jwtDecode(tokens?.access_token);
      if (decodedToken) {
        const user = {
          sub: decodedToken.sub,
          email: decodedToken.email,
          fullName: decodedToken.fullName,
          role: decodedToken.role,
        };
        setTokens(tokens);
        setUserState(user);
        return;
      }
    }
    // localStorage.removeItem("task_user");
    setTokens(null);
    setUserState(null);
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      if (!email || !password) return;

      const response = await loginApi(email, password);
      console.log({
        type: "handleLogin",
        response,
      });
      if (response) {
        const { data } = response;
        const decodedToken: any = jwtDecode(data?.access_token);
        if (decodedToken) {
          const newUser = {
            sub: decodedToken.sub,
            email: decodedToken.email,
            fullName: decodedToken.fullName,
            role: decodedToken.role,
          };
          // localStorage.setItem("task_user", JSON.stringify(data));
          console.log(newUser);

          setTokens(data);
          setUserState(newUser);
          // setCookieLocal(data);
        } else {
          setUserState(null);
        }
      }
    },
    [setUser]
  );

  const handleLogout = async () => {
    try {
      // const task_user = localStorage.getItem("task_user");
      // const tokens = task_user ? JSON.parse(task_user) : null;
      if (tokens) {
        await axiosPrivate.post("/auth/logout", {
          fcmToken: await firebaseCloudMessaging?.tokenInlocalStorage(),
        });
        setUserState(null);
        setTokens(null);
        clearCookieLocal();

        await firebaseCloudMessaging.deleteToken();

        ToastSuccess("Sign out success");
        router.push("/login");
      }
    } catch (error: any) {
      console.log(error);
      ToastError(error.message);
    }
  };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    // if ("serviceWorker" in navigator) {
    //   navigator.serviceWorker.addEventListener("message", (event) =>
    //     console.log("event for the service worker", event)
    //   );
    // }
    socket.connect();
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    const effectFunc = async () => {
      const cookieUser = await getAuthentication();
      console.log("cookieUser", cookieUser);

      if (cookieUser && cookieUser?.access_token) {
        const decodedToken: any = jwtDecode(cookieUser?.access_token);
        if (decodedToken) {
          const newUser = {
            sub: decodedToken.sub,
            email: decodedToken.email,
            fullName: decodedToken.fullName,
            role: decodedToken.role,
          };
          console.log(newUser);
          // localStorage.setItem("task_user", JSON.stringify(cookieUser));
          setUserState(newUser);

          setTokens(cookieUser);
          return;
        }
      } else {
        localStorage.removeItem("task_user");
        setUserState(null);
        setTokens(null);
      }
    };
    effectFunc();
  }, []);

  return (
    <ToastProvider>
      <HeroUIProvider>
        <AppContext.Provider
          value={{
            user,
            tokens,
            setUser,
            isAuthenticated,
            login: handleLogin,
            logout: handleLogout,
          }}
        >
          {user && isAuthenticated && (
            <div className="w-full flex justify-center">
              <div className="flex justify-between gap-5 px-5 min-w-80 py-2 bg-slate-200 rounded-md mt-5">
                <Tooltip content={user?.email}>
                  <div className="text-lg font-bold flex items-center gap-1 cursor-pointer">
                    <CircleUserRound />
                    {user.fullName}
                  </div>
                </Tooltip>
                <Tooltip content="Sign out">
                  <button onClick={handleLogout}>
                    <LogOut size={25} />
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
          <NotificationProvider>{children}</NotificationProvider>
        </AppContext.Provider>
      </HeroUIProvider>
    </ToastProvider>
  );
}
