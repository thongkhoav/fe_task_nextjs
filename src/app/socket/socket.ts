// socket.ts (setup once)

import io from "socket.io-client";
import axios from "axios";
import { READ_ENV } from "../common/util/read-env";

export const socket = io(READ_ENV.SERVER_HOST, {
  transports: ["websocket"],
  withCredentials: true,
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const authClient = axios.create({
  baseURL: READ_ENV.SERVER_HOST + "/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let authenticationRefresh: Promise<void> | null = null;

export const refreshAuthentication = (): Promise<void> => {
  if (!authenticationRefresh) {
    authenticationRefresh = authClient
      .post("/auth/refresh", {})
      .then(() => undefined)
      .finally(() => {
        authenticationRefresh = null;
      });
  }
  return authenticationRefresh;
};

const refreshAndReconnect = async () => {
  try {
    await refreshAuthentication();
    if (!socket.connected) socket.connect();
  } catch {
    socket.disconnect();
    if (typeof window !== "undefined") window.location.assign("/login");
  }
};

socket.on("disconnect", (reason) => {
  if (reason === "io server disconnect") void refreshAndReconnect();
});

socket.on("connect_error", (error) => {
  if (error.message === "Unauthorized") void refreshAndReconnect();
});
