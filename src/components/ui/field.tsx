import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** Label + control + optional hint, so every form in the app lines up. */
export function Field({ label, hint, className, children }: FieldProps) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground/80">{hint}</span>}
    </label>
  );
}

/** Two-column grid on wider screens, one on phones. */
export function FieldRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}
