import { clamp } from "@/lib/utils";

interface ProgressRingProps {
  /** 0-100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  color = "hsl(var(--primary))",
  label,
  sublabel,
}: ProgressRingProps) {
  const pct = clamp(value, 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-2xl font-semibold leading-none">{Math.round(pct)}%</span>
        {label && <span className="mt-1 text-xs font-medium">{label}</span>}
        {sublabel && <span className="text-[11px] text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );
}
