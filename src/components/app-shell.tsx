"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ClipboardCheck,
  LayoutDashboard,
  ListTodo,
  Menu,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogIncidentButton } from "@/components/log-incident-dialog";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
  { href: "/inspections", label: "Inspections", icon: ClipboardCheck },
  { href: "/actions", label: "Actions", icon: ListTodo },
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
    <nav className={cn("flex flex-col gap-1", className)}>
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
                : "text-teal-100/80 hover:bg-white/8 hover:text-white",
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

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 px-3 py-1">
      <span className="flex size-9 items-center justify-center rounded-lg bg-teal-400 text-sm font-bold tracking-tight text-teal-950">
        HSH
      </span>
      <span>
        <span className="block text-sm font-semibold text-white">
          HSH Dashboard
        </span>
        <span className="block text-xs text-teal-200/80">
          Northline Works
        </span>
      </span>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6">
      <Brand />
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto space-y-3 px-3 pb-2 text-xs text-teal-100/70">
        <p>Health, Safety &amp; Hygiene for live production sites.</p>
        <p>Shift: 06:00–14:00 · 1 Sep 2026</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { reset } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-full bg-[#f4f1ea]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-teal-950/40 bg-[#12352f] p-4 md:flex md:flex-col">
        <SidebarBody />
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-stone-200/80 bg-[#f4f1ea]/90 px-4 py-3 backdrop-blur md:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="outline" size="icon" className="md:hidden" />}
            >
              <Menu />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-teal-950/40 bg-[#12352f] p-4 text-white"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>HSH navigation</SheetTitle>
              </SheetHeader>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="md:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LogIncidentButton />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                Maya Chen
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuLabel>HSE Lead · Northline</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    reset();
                    toast.success("Demo data restored");
                  }}
                >
                  Restore demo data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
