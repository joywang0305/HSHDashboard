"use client";

import { Toaster } from "sonner";
import { BoardProvider } from "@/components/board-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BoardProvider>
      {children}
      <Toaster theme="light" />
    </BoardProvider>
  );
}
