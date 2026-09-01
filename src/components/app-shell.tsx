"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, Menu, Newspaper, PanelsTopLeft } from "lucide-react";
import { toast } from "sonner";
import { useBoard } from "@/components/board-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Rooms", icon: CalendarDays },
  { href: "/hub", label: "HSH Hub", icon: Newspaper },
  { href: "/sharepoint", label: "SharePoint", icon: PanelsTopLeft },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-white/12 text-white"
                : "text-teal-100/80 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
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
    <div className="min-h-full bg-[#f4f1ea]">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-teal-950/40 bg-[#12352f] p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-3 px-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-teal-400 text-sm font-bold text-teal-950">
            HSH
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">
              HSH Dashboard
            </span>
            <span className="block text-xs text-teal-200/80">Kiosk board</span>
          </span>
        </Link>
        <NavLinks />
        <p className="mt-auto px-2 text-xs text-teal-100/70">
          One URL for every wall PC. Outlook is the booking source of truth.
        </p>
      </aside>
      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-stone-200/80 bg-[#f4f1ea]/90 px-4 py-3 backdrop-blur md:px-8">
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "md:hidden",
            )}
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
            <span className="sr-only">Open menu</span>
          </button>
          {mobileOpen ? (
            <div className="fixed inset-0 z-50 md:hidden">
              <button
                type="button"
                aria-label="Close menu"
                className="absolute inset-0 bg-black/30"
                onClick={() => setMobileOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 w-72 bg-[#12352f] p-4">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {clock}
              {board ? ` · ${board.source === "graph" ? "Outlook" : "Outlook mock"}` : ""}
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              All kiosks poll the same board feed.
            </p>
          </div>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }), "ml-auto")}
            onClick={() => {
              void resetDemo().then(() =>
                toast.success("Demo board restored"),
              );
            }}
          >
            Restore demo
          </button>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
