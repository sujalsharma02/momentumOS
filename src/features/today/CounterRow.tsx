import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { todayISO } from "@/lib/dates";
import { counterValue } from "@/lib/stats";
import type { CounterId } from "@/types";

interface CounterRowProps {
  counter: CounterId;
  label: string;
  target?: number;
  step?: number;
  unit?: string;
}

/** One line of "value / target" with +/- controls. Logs against today. */
export function CounterRow({ counter, label, target, step = 1, unit }: CounterRowProps) {
  const { dayLogs } = useData();
  const value = counterValue(dayLogs.logs, todayISO(), counter);
  const met = target !== undefined && value >= target;

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-1">
        <span className="tabular mr-1 text-sm">
          <span className={met ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold"}>
            {value}
            {unit}
          </span>
          {target !== undefined && <span className="text-muted-foreground"> / {target}</span>}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => dayLogs.adjustCounter(counter, -step)}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => dayLogs.adjustCounter(counter, step)}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
