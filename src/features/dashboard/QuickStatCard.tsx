import { Minus, Plus } from "lucide-react";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/context/DataContext";
import { counterValue } from "@/lib/stats";
import type { CounterId } from "@/types";
import { todayISO } from "@/lib/dates";

interface QuickStatCardProps {
  label: string;
  icon: string;
  accent: string;
  counter: CounterId;
  target: number;
  step?: number;
  unit?: string;
}

export function QuickStatCard({ label, icon, accent, counter, target, step = 1, unit }: QuickStatCardProps) {
  const { dayLogs } = useData();
  const value = counterValue(dayLogs.logs, todayISO(), counter);
  const pct = Math.min(100, (value / target) * 100);

  return (
    <Card interactive>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            <DynamicIcon name={icon} className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => dayLogs.adjustCounter(counter, -step)}
              aria-label={`Decrease ${label}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => dayLogs.adjustCounter(counter, step)}
              aria-label={`Increase ${label}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="display tabular mt-3 text-4xl">
          {value}
          {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
          <span className="ml-1.5 text-sm font-medium text-muted-foreground">/ {target}</span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
        <Progress value={pct} color={accent} className="mt-3 h-1.5" />
      </CardContent>
    </Card>
  );
}
