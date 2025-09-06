// socket.ts (setup once)

import io from "socket.io-client";
import { READ_ENV } from "../common/util";
export const socket = io(READ_ENV.SERVER_HOST, {
  transports: ["websocket"],
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
