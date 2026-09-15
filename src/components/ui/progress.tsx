import { cn, clamp } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  /** CSS colour for the fill; defaults to the primary colour. */
  color?: string;
}

export function Progress({ value, className, color }: ProgressProps) {
  const pct = clamp(value, 0, 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}
