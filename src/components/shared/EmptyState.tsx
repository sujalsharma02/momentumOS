import type { ReactNode } from "react";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: string;
  title: string;
  /** What this section is for. */
  description: string;
  /** The action(s) that take the user forward. */
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({ icon, title, description, action, compact, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "surface flex flex-col items-center justify-center gap-3 border-dashed text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <DynamicIcon name={icon} className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
