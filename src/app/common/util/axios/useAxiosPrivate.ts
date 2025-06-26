"use client";

import { useEffect } from "react";
import { axiosBase } from "./axiosBase";
import getAuthentication from "@/app/(auth)/actions/get-authentication";
import { jwtDecode } from "jwt-decode";
import deleteCookieAuthen from "@/app/(auth)/actions/delete-cookie-authen";
import { useAppContext } from "@/app/providers/app-provider";
import { useRouter } from "next/navigation";

const useAxiosPrivate = () => {
  //   const refresh = useRefreshToken();
  const { setUser } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    const requestIntercept = axiosBase.interceptors.request.use(
      async (config: any) => {
        // if (!config.headers["Authorization"]) {
        //   config.headers["Authorization"] = `Bearer ${user?.accessToken}`;
        // }
        const tokens = await getAuthentication();
        // console.log("Tokens from getAuthentication:", tokens);
        if (tokens) {
          const access_token = tokens.access_token;
          if (
            access_token &&
            jwtDecode(access_token).exp! * 1000 < Date.now()
          ) {
            // logout and redirect to login page
            // window.location.href = "/login";
            setUser(null);
            deleteCookieAuthen();
            router.push("/login");
            router.refresh();
          }
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // if access token is expired, response will throw back, use refresh token to get new access token
    const responseIntercept = axiosBase.interceptors.response.use(
      (response: any) => response,
      async (error: { config: any; response: { status: number } }) => {
        const prevRequest = error?.config;
        // 500 expire
        // 401 user no longer exist
        console.log("Error response:", error);
        if (
          (error?.response?.status === 500 ||
            error?.response?.status === 401) &&
          !prevRequest?.sent
        ) {
          // prevRequest.sent = true;

          // const newAccessToken = await refresh();
          // prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // clear user and redirect to login page
          console.log("Access token expired, redirecting to login page");
          setUser(null);
          deleteCookieAuthen();
          router.push("/login");
          router.refresh();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosBase.interceptors.request.eject(requestIntercept);
      axiosBase.interceptors.response.eject(responseIntercept);
    };
  }, []);

  return axiosBase;
};

export default useAxiosPrivate;
