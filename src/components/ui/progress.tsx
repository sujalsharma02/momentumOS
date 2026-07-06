import { motion } from "framer-motion";
import { cn, clamp } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  /** CSS color for the fill; defaults to the primary gradient */
  color?: string;
}

export function Progress({ value, className, barClassName, color }: ProgressProps) {
  const pct = clamp(value, 0, 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <motion.div
        className={cn(
          "h-full rounded-full",
          !color && "bg-gradient-to-r from-violet-500 to-cyan-400",
          barClassName,
        )}
        style={color ? { backgroundColor: color } : undefined}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
      />
    </div>
  );
}
