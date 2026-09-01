"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { toast } from "sonner";
import { COMPANY_NAME } from "@/lib/brand";
import { useBoard } from "@/components/board-provider";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Rooms" },
  { href: "/hub", label: "HSH Hub" },
  { href: "/sharepoint", label: "SharePoint" },
];

function NavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex items-center gap-7", className)}>
      {nav.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative py-1 text-[11px] font-medium tracking-[0.28em] uppercase transition-colors",
              active
                ? "text-[#004b49]"
                : "text-[#6b6458] hover:text-[#004b49]",
            )}
          >
            {item.label}
            {active ? (
              <span className="absolute inset-x-0 -bottom-1.5 h-px bg-[#c5a44e]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="min-w-0 px-2 text-center">
      <span
        className="block text-[10px] leading-snug tracking-[0.12em] text-[#004b49] uppercase sm:text-[11px] sm:tracking-[0.16em] md:text-[12px] md:tracking-[0.2em]"
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        {COMPANY_NAME}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { board, resetDemo } = useBoard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    function tick() {
      setClock(
        new Intl.DateTimeFormat("en-GB", {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
      );
    }
    tick();
    const timer = window.setInterval(tick, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-[#f7f3eb]">
      <header className="sticky top-0 z-40 border-b border-[#d9cdb8] bg-white">
        <div className="grid min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2 text-[#004b49] md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
              <span className="sr-only">Open menu</span>
            </button>
            <NavLinks className="hidden md:flex" />
          </div>
          <Wordmark />
          <div className="flex items-center justify-end gap-4">
            <p className="hidden text-[10px] tracking-[0.18em] text-[#6b6458] uppercase sm:block">
              {clock}
              {board
                ? ` · ${board.source === "graph" ? "Outlook" : "Outlook mock"}`
                : ""}
            </p>
            <button
              type="button"
              className="text-[10px] font-medium tracking-[0.22em] text-[#004b49] uppercase hover:text-[#c5a44e]"
              onClick={() => {
                void resetDemo().then(() =>
                  toast.success("Demo board restored"),
                );
              }}
            >
              Restore demo
            </button>
          </div>
        </div>
      </header>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white p-6">
            <div className="mb-8 flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                className="p-2 text-[#004b49]"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
            <NavLinks
              onNavigate={() => setMobileOpen(false)}
              className="flex-col items-start gap-6"
            />
          </div>
        </div>
      ) : null}
      <main className="flex-1">{children}</main>
      <footer className="bg-[#5c5c5c] text-[#f3f3f3]">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <p
            className="text-[12px] tracking-[0.08em]"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            {COMPANY_NAME}
          </p>
          <p className="text-[11px] tracking-[0.08em] text-white/75">
            One URL for every kiosk · Outlook remains the source of truth
          </p>
        </div>
      </footer>
    </div>
  );
}
