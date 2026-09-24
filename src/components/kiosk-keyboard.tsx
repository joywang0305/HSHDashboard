"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const NUMBER_ROW = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const ROW_1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const ROW_2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const ROW_3 = ["Z", "X", "C", "V", "B", "N", "M"];
const PUNCTUATION = ["-", "'", "."];

export function KioskKeyboard({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [shift, setShift] = useState(true);

  useEffect(() => {
    setShift(value.length === 0 || value.endsWith(" "));
  }, [value]);

  function typeChar(char: string) {
    onChange(value + (shift ? char.toUpperCase() : char.toLowerCase()));
    if (shift) setShift(false);
  }

  return (
    <div className={cn("grid gap-1.5 select-none", className)}>
      <KeyRow>
        {NUMBER_ROW.map((key) => (
          <KeyButton key={key} label={key} onPress={() => typeChar(key)} />
        ))}
      </KeyRow>
      <KeyRow>
        {ROW_1.map((key) => (
          <KeyButton
            key={key}
            label={shift ? key : key.toLowerCase()}
            onPress={() => typeChar(key)}
          />
        ))}
      </KeyRow>
      <KeyRow className="px-[4%]">
        {ROW_2.map((key) => (
          <KeyButton
            key={key}
            label={shift ? key : key.toLowerCase()}
            onPress={() => typeChar(key)}
          />
        ))}
      </KeyRow>
      <KeyRow>
        <KeyButton
          label="Shift"
          wide
          active={shift}
          onPress={() => setShift((current) => !current)}
        />
        {ROW_3.map((key) => (
          <KeyButton
            key={key}
            label={shift ? key : key.toLowerCase()}
            onPress={() => typeChar(key)}
          />
        ))}
        <KeyButton
          label="Delete"
          wide
          onPress={() => onChange(value.slice(0, -1))}
        />
      </KeyRow>
      <KeyRow>
        {PUNCTUATION.map((key) => (
          <KeyButton key={key} label={key} onPress={() => typeChar(key)} />
        ))}
        <KeyButton label="Space" flex onPress={() => typeChar(" ")} />
        <KeyButton label="Clear" wide onPress={() => onChange("")} />
      </KeyRow>
    </div>
  );
}

function KeyRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-center gap-1.5", className)}>{children}</div>
  );
}

function KeyButton({
  label,
  onPress,
  wide = false,
  flex = false,
  active = false,
}: {
  label: string;
  onPress: () => void;
  wide?: boolean;
  flex?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onPointerDown={(event) => {
        event.preventDefault();
        onPress();
      }}
      className={cn(
        "h-12 min-w-0 cursor-pointer border px-2 text-sm font-medium text-[#004b49] transition-colors",
        flex ? "flex-[3]" : wide ? "min-w-20 flex-[1.4]" : "flex-1",
        active
          ? "border-[#004b49] bg-[#004b49] text-[#f7f3eb]"
          : "border-[#d9cdb8] bg-white hover:border-[#c5a44e] hover:bg-[#f7f3eb]",
      )}
    >
      {label}
    </button>
  );
}
