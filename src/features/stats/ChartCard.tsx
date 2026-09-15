import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Height of the chart area in px. */
  height?: number;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, height = 200, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent style={{ height }}>{children}</CardContent>
    </Card>
  );
}

/** Tooltip shared by all Recharts charts. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string; dataKey?: string }>;
  label?: string;
  formatter?: (value: number, key: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface px-2.5 py-1.5 text-xs shadow-raised">
      <div className="font-medium">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="tabular mt-0.5 flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {formatter ? formatter(entry.value, String(entry.dataKey ?? entry.name)) : entry.value}
        </div>
      ))}
    </div>
  );
}

export const AXIS_TICK = { fill: "var(--chart-axis)", fontSize: 11 } as const;
export const GRID_STROKE = "var(--chart-grid)";

/* Categorical series slots (blue, aqua, violet, orange). Status colours are
   the reserved status palette in `@/data/pipeline`, never reused here. */
export const SERIES = {
  blue: "#3987e5",
  green: "#199e70",
  violet: "#9085e9",
  orange: "#d95926",
  amber: "#c98500",
} as const;
