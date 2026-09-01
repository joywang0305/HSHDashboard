"use client";

import { useEffect, type ReactNode } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppModal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#004b49]/55"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border border-[#c5a44e] bg-[#fffcf7] p-6 text-sm text-[#1c1914] shadow-2xl",
          className,
        )}
      >
        <div className="flex flex-col gap-1 pr-8">
          <p className="text-[10px] tracking-[0.32em] text-[#c5a44e] uppercase">
            Reserve
          </p>
          <h2
            id="app-modal-title"
            className="text-3xl font-medium italic"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-[#6b6458]">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="absolute top-3 right-3 p-2 text-[#6b6458] hover:text-[#004b49]"
          onClick={onClose}
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
}
