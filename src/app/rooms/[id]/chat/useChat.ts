// rooms/[id]/chat/useChat.ts
import { useEffect, useState } from "react";
import { socket } from "@/app/socket/socket";
import useAxiosPrivate from "@/app/common/util/axios/useAxiosPrivate";
import { RoomDetail } from "@/apiRequests/room/room-detail.type";
import { ToastError } from "@/app/common/util/toast";
import { useRouter } from "next/navigation";
import { Message } from "@/apiRequests/chat/message.type";

interface RoomDetailResponse {
  data: RoomDetail;
}

export function useChat(roomId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const axiosPrivate = useAxiosPrivate();
  const router = useRouter();
  const [roomDetail, setRoomDetail] = useState<RoomDetail>();

  useEffect(() => {
    if (!roomId) return;

    const loadRoomAndConnectSocket = async () => {
      console.log("Loading room and connecting to socket for roomId:", roomId);
      try {
        const roomData = await axiosPrivate.get<RoomDetailResponse>(
          "/room/" + roomId
        );
        const detail = roomData?.data?.data;
        setRoomDetail(detail);
        if (!socket.hasListeners("newMessage")) {
          // Join the room
          socket.emit("joinRoom", roomId);

          // Load history
          socket.on("chatHistory", (history) => {
            setMessages(history);
            console.log({ history });
            scrollMessageList();
          });

          // Listen for new messages
          socket.on("newMessage", (msg) => {
            console.log("newMessage", msg);
            setMessages((prev) => [...prev, msg]);
            scrollMessageList();
          });
        }
      } catch (err: any) {
        console.error(err);
        ToastError(err?.response?.data?.message || "Failed to load room");
        router.push("/rooms");
      }
    };

    loadRoomAndConnectSocket();

    return () => {
      console.log("Cleaning up socket listeners for roomId:", roomId);
      socket.off("chatHistory");
      socket.off("newMessage");
      socket.emit("leaveRoom", roomId);
    };
  }, [roomId]);

  // Send message
  const sendMessage = (content: string) => {
    socket.emit("sendMessage", { roomId, userId, content });
  };

  const scrollMessageList = () => {
    const messageListElement = document.getElementById("message-list");
    if (messageListElement) {
      setTimeout(() => {
        //scroll smoothly
        messageListElement.scrollTo({
          top: messageListElement.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  };

  return { messages, sendMessage, roomDetail };
}
