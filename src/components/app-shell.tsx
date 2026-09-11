"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { toast } from "sonner";
import { COMPANY_NAME, COMPANY_NAME_ZH } from "@/lib/brand";
import { useBoard } from "@/components/board-provider";
import { OFFICE_FLOORS } from "@/lib/floor-plan";
import { TIMEZONE } from "@/lib/time";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/rooms", label: "Meeting rooms" },
];

const KIOSK_ROTATE_MS = 60_000;
const KIOSK_IDLE_MS = 5 * 60_000;

function kioskPeer(pathname: string) {
  return pathname === "/" ? "/rooms" : "/";
}

function isKioskPath(pathname: string) {
  return pathname === "/" || pathname.startsWith("/rooms");
}

function NavLinks({
  onNavigate,
  onLeave,
  className,
}: {
  onNavigate?: () => void;
  onLeave?: (href: string) => void;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 lg:gap-x-7", className)}>
      {nav.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            scroll={false}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              onNavigate?.();
              if (active) {
                event.preventDefault();
                return;
              }
              onLeave?.(item.href);
            }}
            className={cn(
              "relative z-20 cursor-pointer px-1 py-2 text-[11px] font-medium tracking-[0.28em] uppercase transition-colors",
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
    <Link href="/" className="flex min-w-0 max-w-full items-center gap-1.5 px-1 text-[12px] leading-snug">
      <Image
        src="/hsh-logo.png"
        alt=""
        width={80}
        height={78}
        className="size-8 shrink-0 object-contain"
        style={{ height: 32, width: 32 }}
        priority
      />
      <span className="min-w-0 truncate text-left text-[12px] leading-snug">
        <span
          className="block truncate text-[10px] leading-snug tracking-[0.12em] text-[#004b49] uppercase sm:text-[11px] sm:tracking-[0.16em] md:text-[12px] md:tracking-[0.2em]"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {COMPANY_NAME}
        </span>
        <span className="block text-[11px] leading-snug tracking-[0.12em] text-[#004b49]">
          {COMPANY_NAME_ZH}
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { board, now, resetDemo } = useBoard();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [leavingTo, setLeavingTo] = useState<string | null>(null);
  const nextSwitchAt = useRef(Date.now() + KIOSK_ROTATE_MS);

  useEffect(() => {
    function onUser() {
      nextSwitchAt.current = Date.now() + KIOSK_IDLE_MS;
    }
    window.addEventListener("pointerdown", onUser, true);
    window.addEventListener("keydown", onUser, true);
    return () => {
      window.removeEventListener("pointerdown", onUser, true);
      window.removeEventListener("keydown", onUser, true);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (leavingTo) return;
      if (document.visibilityState === "hidden") return;
      if (document.querySelector('[role="dialog"]')) {
        nextSwitchAt.current = Date.now() + KIOSK_IDLE_MS;
        return;
      }
      if (Date.now() < nextSwitchAt.current) return;
      const path = window.location.pathname;
      if (!isKioskPath(path)) {
        nextSwitchAt.current = Date.now() + KIOSK_ROTATE_MS;
        return;
      }
      router.push(kioskPeer(path));
      nextSwitchAt.current = Date.now() + KIOSK_ROTATE_MS;
    }, 1000);
    return () => window.clearInterval(id);
  }, [leavingTo, router]);

  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/rooms");
    const preload = () => {
      for (const floor of OFFICE_FLOORS) {
        const cad = new window.Image();
        cad.src = floor.asset;
        if (!floor.elevation) continue;
        const photo = new window.Image();
        photo.src = floor.elevation;
      }
    };
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
    const id = idle(preload);
    return () => {
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(id as number);
      }
    };
  }, [router]);

  useEffect(() => {
    setLeavingTo(null);
  }, [pathname]);

  useEffect(() => {
    if (!leavingTo) return;
    const id = window.setTimeout(() => {
      if (window.location.pathname !== leavingTo) {
        window.location.assign(leavingTo);
      }
    }, 2500);
    return () => window.clearTimeout(id);
  }, [leavingTo]);
  const clock = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: board?.timezone ?? TIMEZONE,
  }).format(now);

  return (
    <div className="flex h-full flex-col bg-[#f7f3eb]">
      <header className="sticky top-0 z-40 shrink-0 border-b border-[#d9cdb8] bg-white">
        <div className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:px-8">
          <div className="relative z-20 flex items-center gap-4">
            <button
              type="button"
              className="p-2 text-[#004b49] md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
              <span className="sr-only">Open menu</span>
            </button>
            <NavLinks
              className="relative z-20 hidden md:flex"
              onLeave={setLeavingTo}
            />
          </div>
          <div className="flex min-w-0 justify-center overflow-hidden">
            <Wordmark />
          </div>
          <div className="relative z-20 flex items-center justify-end gap-4">
            <p
              className="hidden text-[10px] tracking-[0.18em] text-[#6b6458] uppercase sm:block"
              suppressHydrationWarning
            >
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
              onLeave={setLeavingTo}
              className="flex-col items-start gap-6"
            />
          </div>
        </div>
      ) : null}
      <main
        className={cn(
          "relative flex h-0 min-h-0 flex-1 flex-col",
          pathname === "/" ? "overflow-hidden" : "overflow-y-auto",
        )}
      >
        {children}
        {leavingTo ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#f7f3eb]">
            <p className="text-xs tracking-[0.28em] text-[#004b49] uppercase">
              {leavingTo === "/rooms"
                ? "Opening meeting rooms"
                : "Opening dashboard"}
            </p>
          </div>
        ) : null}
      </main>
      <footer className="shrink-0 bg-[#5c5c5c] text-[#f3f3f3]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-1.5 text-[12px] leading-snug">
            <Image
              src="/hsh-logo.png"
              alt=""
              width={80}
              height={78}
              className="size-8 shrink-0 object-contain"
              style={{ height: 32, width: 32 }}
            />
            <div>
              <p
                className="text-[12px] leading-snug tracking-[0.08em]"
                style={{ fontFamily: "var(--font-cinzel), serif" }}
              >
                {COMPANY_NAME}
              </p>
              <p className="text-[11px] leading-snug tracking-[0.08em] text-white/80">
                {COMPANY_NAME_ZH}
              </p>
            </div>
          </div>
          <p className="text-[11px] tracking-[0.08em] text-white/75">
            One URL for every kiosk · Outlook remains the source of truth
          </p>
        </div>
      </footer>
    </div>
  );
}
