import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { toISODate, todayISO } from "@/lib/dates";
import { dayCompletion } from "@/lib/stats";
import { cn } from "@/lib/utils";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

/** Month grid with a heat dot per day showing how much of the timetable was done. */
export function MiniCalendar() {
  const { dayLogs, plan } = useData();
  const now = new Date();
  const today = todayISO();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-based

  const cells: Array<{ date: string; day: number } | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      date: toISODate(new Date(year, month, i + 1)),
      day: i + 1,
    })),
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center">
          {DOW.map((d, i) => (
            <div key={i} className="pb-1 text-[10px] font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {cells.map((cell, index) => {
            if (!cell) return <div key={`empty-${index}`} />;
            const completion = dayCompletion(dayLogs.logs, cell.date, plan.taskIds);
            const isToday = cell.date === today;
            const isFuture = cell.date > today;
            return (
              <div
                key={cell.date}
                title={isFuture ? undefined : `${cell.date} — ${completion}% complete`}
                className={cn(
                  "relative mx-auto flex h-7 w-7 items-center justify-center rounded-md text-xs tabular",
                  isToday && "bg-accent font-semibold",
                  isFuture && "text-muted-foreground/40",
                )}
              >
                {cell.day}
                {!isFuture && completion > 0 && (
                  <span
                    className="absolute bottom-0.5 h-1 w-1 rounded-full"
                    style={{
                      backgroundColor:
                        completion >= 75 ? "#0ca30c" : completion >= 40 ? "#3987e5" : "#9085e9",
                      opacity: 0.5 + completion / 200,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#9085e9]" /> started</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#3987e5]" /> solid</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#0ca30c]" /> crushed it</span>
        </div>
      </CardContent>
    </Card>
  );
}
