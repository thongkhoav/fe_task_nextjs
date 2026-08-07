"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
export default function RoomLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-[calc(100vh-73px)] w-full flex-col">
      <DndProvider backend={HTML5Backend}>{children}</DndProvider>
    </div>
  );
}
