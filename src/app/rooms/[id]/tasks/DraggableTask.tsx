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
      className={`${isDragging ? "opacity-50" : ""} ${
        canDrag ? "cursor-move" : ""
      } 
        bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md mb-2 px-1 
      `}
    >
      {children}
    </div>
  );
}
