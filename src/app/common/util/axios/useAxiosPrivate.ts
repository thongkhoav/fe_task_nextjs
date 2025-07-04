"use client";

import { useEffect } from "react";
import { axiosBase } from "./axiosBase";
import getAuthentication from "@/app/(auth)/actions/get-authentication";
import { jwtDecode } from "jwt-decode";
import deleteCookieAuthen from "@/app/(auth)/actions/delete-cookie-authen";
import { useAppContext } from "@/app/providers/app-provider";
import { useRouter } from "next/navigation";
import { AuthError } from "../../type/error-server.type";

const useAxiosPrivate = () => {
  //   const refresh = useRefreshToken();
  const { setUser } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    const requestIntercept = axiosBase.interceptors.request.use(
      async (config: any) => {
        // get user from cookie
        const cookieUser = await getAuthentication();
        if (!cookieUser) {
          console.log("No user found in cookie, redirecting to login page");
          setUser(null);
          deleteCookieAuthen();
          router.push("/login");
          router.refresh();
          return config;
        }

        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // if access token is expired, response will throw back, use refresh token to get new access token
    const responseIntercept = axiosBase.interceptors.response.use(
      (response: any) => response,
      async (error: {
        config: any;
        response: { status: number; data: any };
      }) => {
        const prevRequest = error?.config;
        // 500 expire
        // 401 user no longer exist
        console.log("Error response:", error);
        if (error?.response?.status === 401 && !prevRequest?.sent) {
          prevRequest.sent = true;
          // const newAccessToken = await axiosBase.post("/auth/refresh");
          // prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // clear user and redirect to login page
          // console.log("Access token expired, redirecting to login page");
          try {
            const refreshResponse = await axiosBase.post("/auth/refresh");
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
              return axiosBase(prevRequest);
            }
          } catch (refreshError: any) {
            console.log("Error refreshing access token:", refreshError);
            console.log("Refresh token expired, redirecting to login page");

            if (
              refreshError?.response?.data?.message ===
              AuthError.REFRESH_TOKEN_EXPIRED
            ) {
              setUser(null);
              deleteCookieAuthen();
              router.push("/login");
              router.refresh();
            }
            return Promise.reject(refreshError);
          }
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
