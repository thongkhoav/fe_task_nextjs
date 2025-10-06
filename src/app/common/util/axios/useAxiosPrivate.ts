"use client";

import { useEffect } from "react";
import getAuthentication from "@/app/(auth)/actions/get-authentication";
import { jwtDecode } from "jwt-decode";
import deleteCookieAuthen from "@/app/(auth)/actions/delete-cookie-authen";
import { useAppContext } from "@/app/providers/app-provider";
import { useRouter } from "next/navigation";
import { AuthError } from "../../type/error-server.type";
import { firebaseCloudMessaging } from "@/app/config/firebase";
import axios from "axios";

export const axiosBase2 = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_HOST + "/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const axiosNoIntercept = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_HOST + "/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const useAxiosPrivate = () => {
  //   const refresh = useRefreshToken();
  const { setUser, tokens, user } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    const requestIntercept = axiosBase2.interceptors.request.use(
      async (config: any) => {
        console.log("request request:");
        const cookieUser = await getAuthentication();
        console.log("request cookieUser:", cookieUser);
        if (cookieUser && cookieUser?.access_token) {
          try {
            const decoded: any = jwtDecode(cookieUser?.access_token);
            const isExpired = decoded.exp * 1000 < Date.now();

            if (isExpired) {
              console.log("Access token expired. Refreshing...");
              try {
                const refreshRes = await axiosNoIntercept.post(
                  "/auth/refresh",
                  {
                    fcmToken: firebaseCloudMessaging?.tokenInlocalStorage(),
                  }
                );

                // update user in context
                setUser(refreshRes.data);

                // backend already set cookies; we just continue
              } catch (err) {
                console.error("Failed to refresh token:", err);
                deleteCookieAuthen();
                setUser(null);
                router.push("/login");
                router.refresh();
                return Promise.reject(err);
              }
            }
          } catch (decodeErr) {
            console.warn("Invalid access token, redirecting to login");
            deleteCookieAuthen();
            setUser(null);
            router.push("/login");
            router.refresh();
            return Promise.reject(decodeErr);
          }
        } else {
          deleteCookieAuthen();
          setUser(null);
          router.push("/login");
          router.refresh();
          return Promise.reject();
        }

        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // if access token is expired, response will throw back, use refresh token to get new access token
    const responseIntercept = axiosBase2.interceptors.response.use(
      (response: any) => response,
      async (error: {
        config: any;
        response: { status: number; data: any };
      }) => {
        if (error?.response?.status === 401) {
          console.warn("401 response - redirecting to login");
          deleteCookieAuthen();
          setUser(null);
          router.push("/login");
          router.refresh();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosBase2.interceptors.request.eject(requestIntercept);
      axiosBase2.interceptors.response.eject(responseIntercept);
    };
  }, []);

  return axiosBase2;
};

export default useAxiosPrivate;
