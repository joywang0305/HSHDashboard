"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { toast } from "sonner";
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
    <nav className={cn("flex items-center gap-8", className)}>
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
                ? "text-[#c5a44e]"
                : "text-white/75 hover:text-white",
            )}
          >
            {item.label}
            {active ? (
              <span className="absolute inset-x-0 -bottom-2 h-px bg-[#c5a44e]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="group flex flex-col items-center text-center">
      <span className="text-[9px] tracking-[0.55em] text-[#c5a44e]">THE</span>
      <span
        className="mt-0.5 text-[22px] leading-none tracking-[0.42em] text-white"
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        HSH
      </span>
      <span className="mt-1 text-[8px] tracking-[0.48em] text-white/70">
        DASHBOARD
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
    <div className="min-h-full bg-[#f7f3eb]">
      <header className="sticky top-0 z-40 border-b border-[#c5a44e] bg-[#004b49] text-white">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="border border-[#c5a44e]/60 p-2 text-[#c5a44e] md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
              <span className="sr-only">Open menu</span>
            </button>
            <div className="hidden min-w-0 md:block">
              <p className="text-[11px] tracking-[0.22em] text-[#c5a44e] uppercase">
                {clock}
              </p>
              <p className="mt-0.5 text-[10px] tracking-[0.16em] text-white/55 uppercase">
                {board
                  ? board.source === "graph"
                    ? "Outlook live"
                    : "Outlook mock"
                  : "Board"}
              </p>
            </div>
          </div>
          <Wordmark />
          <div className="flex justify-end">
            <button
              type="button"
              className="border border-[#c5a44e] px-3 py-2 text-[10px] font-medium tracking-[0.22em] text-[#c5a44e] uppercase transition-colors hover:bg-[#c5a44e] hover:text-[#004b49]"
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
        <div className="hidden justify-center border-t border-[#c5a44e]/30 py-3 md:flex">
          <NavLinks />
        </div>
      </header>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#004b49] p-6">
            <div className="mb-8 flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                className="p-2 text-[#c5a44e]"
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
      <main>{children}</main>
    </div>
  );
}
