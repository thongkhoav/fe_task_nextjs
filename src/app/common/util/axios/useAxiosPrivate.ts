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

const useAxiosPrivate = () => {
  //   const refresh = useRefreshToken();
  const { setUser } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    const requestIntercept = axiosBase2.interceptors.request.use(
      async (config: any) => {
        // get user from cookie
        // const cookieUser = await getAuthentication();
        // if (!cookieUser) {
        //   console.log("No user found in cookie, redirecting to login page");
        //   setUser(null);
        //   deleteCookieAuthen();
        //   router.push("/login");
        //   router.refresh();
        //   return config;
        // }

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
        // log request url
        console.log("Request URL:", error?.config?.url);
        const prevRequest = error?.config;
        // 500 expire
        // 401 user no longer exist
        console.log("Error response:", error);
        const cookieUser = await getAuthentication();
        if (
          error?.response?.status === 401 &&
          !prevRequest?.sent &&
          cookieUser
        ) {
          prevRequest.sent = true;
          // const newAccessToken = await axiosBase.post("/auth/refresh");
          // prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // clear user and redirect to login page
          // console.log("Access token expired, redirecting to login page");
          try {
            // If no user found in cookie, redirect to login
            if (!cookieUser) {
              console.log("No user found in cookie, redirecting to login page");
              setUser(null);
              deleteCookieAuthen();
              router.push("/login");
              router.refresh();
              return Promise.reject(error);
            }

            const refreshResponse = await axiosBase2.post("/auth/refresh", {
              fcmToken: firebaseCloudMessaging?.tokenInlocalStorage(),
            });
            const decodedToken: any = jwtDecode(
              refreshResponse?.data?.access_token
            );
            if (decodedToken) {
              const newUser = {
                sub: decodedToken.sub,
                email: decodedToken.email,
                fullName: decodedToken.fullName,
                role: decodedToken.role,
              };
              console.log(newUser);
              // localStorage.setItem("task_user", JSON.stringify(cookieUser));
              setUser(refreshResponse?.data);
              return axiosBase2(prevRequest);
            }
          } catch (refreshError: any) {
            console.log("Error refreshing access token:", refreshError);
            console.log("Refresh token expired, redirecting to login page");
            setUser(null);
            deleteCookieAuthen();
            router.push("/login");
            router.refresh();
            if (
              refreshError?.response?.data?.message ===
              AuthError.REFRESH_TOKEN_EXPIRED
            ) {
            }
            return Promise.reject(refreshError);
          }
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
