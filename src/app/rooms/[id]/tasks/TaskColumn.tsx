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
      className="flex flex-col p-4 bg-gray-100 rounded-md shadow-md flex-1 gap-2"
    >
      <h2 className={`text-lg font-semibold mb-2 ${badgeColor}`}>
        {status} ({tasks.length})
      </h2>
      {tasks.length === 0 && (
        <div className="text-center text-gray-500">No tasks in this column</div>
      )}
      {children}
    </div>
  );
}
