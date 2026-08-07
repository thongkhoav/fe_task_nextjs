"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { ChevronLeft, MessageCircle, Send } from "lucide-react";

import { useChat } from "./useChat";
import { useAppContext } from "@/app/providers/app-provider";
import { RoomTabs } from "@/components/app/room-tabs";
import { Avatar } from "@/components/app/avatar";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAppContext();
  const { id: roomId } = params;
  const { messages, sendMessage, roomDetail } = useChat(roomId);
  const [input, setInput] = useState("");

  const handleSend = () => {
    const message = input.trim();
    if (!message) return;
    sendMessage(message);
    setInput("");
  };

  return (
    <main className="app-container flex min-h-[calc(100dvh-73px)] w-full flex-col gap-5 pb-6 pt-6 sm:pt-8">
      <section className="surface-card flex items-center gap-3 p-4 sm:p-5">
        <Link href="/rooms" className="icon-button shrink-0 bg-slate-50" aria-label="Back to rooms">
          <ChevronLeft size={21} />
        </Link>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Room workspace</p>
          <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {roomDetail?.roomName || "Conversation"}
          </h1>
          <p className="mt-1 hidden truncate text-sm text-slate-500 sm:block">
            {roomDetail?.roomDescription || "Loading room details..."}
          </p>
        </div>
      </section>

      <RoomTabs roomId={roomId} active="chat" />

      <section className="surface-card flex min-h-[34rem] flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <MessageCircle size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Room conversation</h2>
            <p className="text-xs text-slate-500">
              {messages.length} {messages.length === 1 ? "message" : "messages"}
            </p>
          </div>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-3 py-5 sm:px-6"
          id="message-list"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                <MessageCircle size={25} />
              </span>
              <h3 className="mt-5 font-bold text-slate-900">Start the conversation</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Share an update, ask a question, or help your team move work forward.
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const currentDate = new Date(message.createdAt);
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showDate =
                !previousMessage ||
                !isSameDay(new Date(previousMessage.createdAt), currentDate);
              const isOwnMessage = message.sender.id === user?.id;

              return (
                <div key={`${message.createdAt}-${index}`}>
                  {showDate && (
                    <div className="my-5 flex items-center gap-3" aria-label={format(currentDate, "MMMM dd, yyyy")}>
                      <span className="h-px flex-1 bg-slate-200" />
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                        {format(currentDate, "MMM dd, yyyy")}
                      </span>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>
                  )}

                  <div className={`mb-4 flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    {!isOwnMessage && (
                      <Avatar name={message.sender?.fullName} className="size-8 rounded-lg text-[10px]" />
                    )}
                    <div className={`max-w-[82%] sm:max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
                      <div className="mb-1.5 flex items-center gap-2 px-1 text-xs text-slate-400">
                        {!isOwnMessage && (
                          <span className="font-semibold text-slate-600">{message.sender?.fullName || "Unknown"}</span>
                        )}
                        <time dateTime={message.createdAt}>{format(currentDate, "HH:mm")}</time>
                      </div>
                      <p
                        className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${
                          isOwnMessage
                            ? "rounded-br-md bg-indigo-600 text-white"
                            : "rounded-bl-md border border-slate-200/80 bg-white text-slate-700"
                        }`}
                      >
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          className="flex items-end gap-2 border-t border-slate-100 bg-white p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSend();
          }}
        >
          <label htmlFor="chat-message" className="sr-only">Message</label>
          <textarea
            id="chat-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Write a message..."
            className="min-h-11 max-h-32 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm leading-6 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}
