import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: ReactNode;
  /** Small line under the value: a delta, a denominator, a hint. */
  detail?: ReactNode;
  accent?: string;
  className?: string;
}

/**
 * A compact number tile. Deliberately unboxed so a row of six reads as one
 * scannable strip; wrap in a Card when it needs its own surface.
 */
export function Stat({ label, value, detail, accent, className }: StatProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="eyebrow truncate">{label}</div>
      <div
        className="tabular mt-1 text-2xl font-semibold leading-none tracking-tight"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {detail && <div className="mt-1 truncate text-xs text-muted-foreground">{detail}</div>}
    </div>
  );
}

/** Horizontal strip of Stats separated by hairlines: the app's summary row. */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "surface grid grid-cols-2 gap-x-4 gap-y-5 p-4 sm:grid-cols-3 lg:flex lg:gap-0 lg:divide-x lg:divide-border lg:p-0 [&>*]:lg:flex-1 [&>*]:lg:px-5 [&>*]:lg:py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
