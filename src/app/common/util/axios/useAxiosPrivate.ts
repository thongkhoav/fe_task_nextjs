"use client";

import { refreshAuthentication, socket } from "@/app/socket/socket";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const axiosPrivate = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_HOST + "/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      if (typeof window !== "undefined") window.location.assign("/login");
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      await refreshAuthentication();
      if (socket.connected) {
        socket.disconnect();
        socket.connect();
      }
      return axiosPrivate(originalRequest);
    } catch (refreshError) {
      if (typeof window !== "undefined") window.location.assign("/login");
      return Promise.reject(refreshError);
    }
  },
);

const useAxiosPrivate = () => axiosPrivate;

export default useAxiosPrivate;
