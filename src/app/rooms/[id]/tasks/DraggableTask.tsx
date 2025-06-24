"use client";

import { Task } from "./page";
import { useDrag } from "react-dnd";

type Props = {
  item: Task;
  children: React.ReactNode;
};

export default function DraggableTask({ item, children }: Props) {
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
        dragRef(node);
      }}
      className={`${
        isDragging ? "opacity-50" : ""
      } cursor-move bg-white rounded-md p-2 shadow-md`}
    >
      {children}
    </div>
  );
}
