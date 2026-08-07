"use client";

import { useDrop } from "react-dnd";
import { Task } from "./page";

export default function TaskColumn({
  status,
  tasks,
  badgeColor,
  onDropTask,
  children,
}: {
  status: string;
  tasks: Task[];
  onDropTask: (taskId: string, status: string) => void;
  children: React.ReactNode;
  badgeColor: string;
}) {
  const statusLabel: Record<string, string> = {
    TODO: "To do",
    PROCESSING: "In progress",
    DONE: "Completed",
  };

  const statusDot: Record<string, string> = {
    TODO: "bg-amber-500",
    PROCESSING: "bg-indigo-500",
    DONE: "bg-emerald-500",
  };

  const [, dropRef] = useDrop({
    accept: "TASK",
    drop: (draggedItem: { id: string; status: string }) => {
      if (draggedItem.status !== status) {
        onDropTask(draggedItem.id, status);
      }
    },
  });

  return (
    <div
      ref={(node) => {
        dropRef(node);
      }}
      className="flex min-h-[32rem] min-w-[min(86vw,22rem)] snap-start flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-3 sm:min-w-[21rem] lg:min-w-0 lg:flex-1"
    >
      <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-3 shadow-sm">
        <h2 className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
          <span className={`size-2.5 rounded-full ${statusDot[status] || "bg-slate-400"}`} />
          {statusLabel[status] || status}
        </h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeColor}`}>
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 && (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 px-6 text-center text-sm leading-6 text-slate-400">
          Drop a task here or create a new one.
        </div>
      )}
      {children}
    </div>
  );
}
