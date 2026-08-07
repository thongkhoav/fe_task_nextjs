"use client";

import { Task } from "./page";
import { useDrag } from "react-dnd";

type Props = {
  item: Task;
  canDrag?: boolean;
  children: React.ReactNode;
};

export default function DraggableTask({ item, children, canDrag }: Props) {
  const [{ isDragging }, dragRef] = useDrag({
    type: "TASK",
    item: { id: item.id, status: item.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={(node) => {
        if (!canDrag) {
          return;
        }
        dragRef(node);
      }}
      className={`${isDragging ? "scale-[0.98] opacity-50" : ""} ${
        canDrag ? "cursor-grab active:cursor-grabbing" : ""
      } rounded-xl border border-slate-200/80 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md`}
    >
      {children}
    </div>
  );
}
