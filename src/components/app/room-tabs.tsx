"use client";

import Link from "next/link";
import { ListTodo, MessageCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type RoomTab = "tasks" | "members" | "chat";

export function RoomTabs({ roomId, active }: { roomId: string; active: RoomTab }) {
  const tabs = [
    { key: "tasks" as const, label: "Tasks", icon: ListTodo },
    { key: "members" as const, label: "Members", icon: Users },
    { key: "chat" as const, label: "Chat", icon: MessageCircle },
  ];

  return (
    <nav
      aria-label="Room navigation"
      className="flex w-full max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm"
    >
      {tabs.map(({ key, label, icon: Icon }) => (
        <Link
          key={key}
          href={`/rooms/${roomId}/${key}`}
          aria-current={active === key ? "page" : undefined}
          className={cn(
            "flex min-h-10 min-w-[6.5rem] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition sm:min-w-28 sm:px-4",
            active === key
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          <Icon size={17} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
