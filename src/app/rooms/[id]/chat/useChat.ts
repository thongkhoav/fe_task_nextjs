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

export function useChat(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const axiosPrivate = useAxiosPrivate();
  const router = useRouter();
  const [roomDetail, setRoomDetail] = useState<RoomDetail>();

  useEffect(() => {
    if (!roomId) return;

    let active = true;
    const joinRoom = () => socket.emit("joinRoom", roomId);
    const handleChatHistory = (history: Message[]) => {
      setMessages(history);
      scrollMessageList();
    };
    const handleNewMessage = (message: Message) => {
      setMessages((previousMessages) => [...previousMessages, message]);
      scrollMessageList();
    };

    const loadRoomAndConnectSocket = async () => {
      try {
        const roomData = await axiosPrivate.get<RoomDetailResponse>(
          "/room/" + roomId,
        );
        const detail = roomData?.data?.data;
        if (!active) return;
        setRoomDetail(detail);
        socket.on("connect", joinRoom);
        socket.on("chatHistory", handleChatHistory);
        socket.on("newMessage", handleNewMessage);
        if (socket.connected) joinRoom();
      } catch (err: any) {
        if (!active) return;
        console.error(err);
        ToastError(err?.response?.data?.message || "Failed to load room");
        router.push("/rooms");
      }
    };

    loadRoomAndConnectSocket();

    return () => {
      active = false;
      socket.off("connect", joinRoom);
      socket.off("chatHistory", handleChatHistory);
      socket.off("newMessage", handleNewMessage);
      if (socket.connected) socket.emit("leaveRoom", roomId);
    };
  }, [axiosPrivate, roomId, router]);

  // Send message
  const sendMessage = (content: string) => {
    socket.emit("sendMessage", { roomId, content });
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
