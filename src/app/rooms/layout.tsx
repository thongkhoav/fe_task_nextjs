"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
export default function RoomLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col justify-center w-full min-h-screen">
      <DndProvider backend={HTML5Backend}>{children}</DndProvider>
    </div>
  );
}
