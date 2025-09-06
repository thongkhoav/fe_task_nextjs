// rooms/[id]/chat/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useChat } from "./useChat";
import { useAppContext } from "@/app/providers/app-provider";
import { ChevronLeft, Send } from "lucide-react";
import { Tooltip } from "@heroui/react";
import Link from "next/link";
import { format, isSameDay } from "date-fns";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAppContext();
  const { id: roomId } = params;
  const { messages, sendMessage, roomDetail } = useChat(
    roomId as string,
    user?.sub as string
  );
  const [input, setInput] = useState("");

  //   useEffect(() => {
  //     if (!roomId || !user)
  //   }, [roomId, user]);

  const handleSend = () => {
    if (!input.trim()) return;
    console.log("Sending message:", input);
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-128px)] flex flex-col container mx-auto px-4 gap-4 py-4">
      <h2 className="bg-slate-200 rounded-md p-4 flex gap-4 items-center">
        <Tooltip content="Back to tasks">
          <Link href={`/rooms/${roomId}/tasks`} passHref>
            <ChevronLeft />
          </Link>
        </Tooltip>
        <p>Chat Room {roomDetail?.roomName}</p>
      </h2>

      {/* Scrollable messages */}
      <div
        className="flex-1 overflow-y-auto bg-slate-100 p-4 rounded-lg"
        id="message-list"
      >
        {messages.map((m, i) => {
          const currentDate = new Date(m.createdAt);

          // check if previous message has the same date
          const prevMessage = i > 0 ? messages[i - 1] : null;
          const showDate =
            !prevMessage ||
            !isSameDay(new Date(prevMessage.createdAt), currentDate);

          return (
            <div key={i}>
              {/* Render date header once per day */}
              {showDate && (
                <div className="text-center text-gray-500 text-sm my-2">
                  {format(currentDate, "MMMM dd, yyyy")}
                </div>
              )}

              <div
                className={`mb-2 p-2 rounded-lg w-2/5 ${
                  m?.sender.id === user?.sub && "ml-auto"
                }`}
              >
                <div>
                  <span className="text-sm text-gray-500">
                    {format(currentDate, "HH:mm")}
                  </span>
                </div>
                <p
                  className={`${
                    m?.sender.id === user?.sub ? "bg-blue-100" : "bg-slate-200"
                  } p-2 rounded-md`}
                >
                  {m?.sender.id !== user?.sub ? (
                    <b>{m.sender?.fullName || "Unknown"}:</b>
                  ) : (
                    <b>You:</b>
                  )}{" "}
                  {m.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input form */}
      <form
        className="flex gap-2 mb-4 bg-slate-200 p-4 rounded-md"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none"
        />

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          <Send />
        </button>
      </form>
    </div>
  );
}
