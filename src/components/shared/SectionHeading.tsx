import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  count?: number;
  actions?: ReactNode;
  className?: string;
}

/** Eyebrow-style heading used between groups of cards. */
export function SectionHeading({ title, count, actions, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-2.5 flex items-center justify-between gap-3", className)}>
      <h2 className="eyebrow flex items-center gap-2">
        {title}
        {count !== undefined && (
          <span className="tabular rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {count}
          </span>
        )}
      </h2>
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}
    </div>
  );
}
