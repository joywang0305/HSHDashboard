import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function NativeSelect({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full border border-[#d9cdb8] bg-white px-3 text-sm tracking-normal text-[#1c1914] outline-none focus-visible:border-[#c5a44e] focus-visible:ring-1 focus-visible:ring-[#c5a44e]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function NativeInput({
  className,
  ...props
}: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full border border-[#d9cdb8] bg-white px-3 text-sm font-normal tracking-normal text-[#1c1914] outline-none placeholder:text-[#6b6458] focus-visible:border-[#c5a44e] focus-visible:ring-1 focus-visible:ring-[#c5a44e]",
        className,
      )}
      {...props}
    />
  );
}
