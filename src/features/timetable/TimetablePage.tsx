import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/context/DataContext";
import { useNow } from "@/hooks/useNow";
import { TIMETABLE } from "@/data/timetable";
import { getLog } from "@/lib/stats";
import { todayISO, WEEKDAY_NAMES } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TimetableBlock } from "@/types";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function blockState(block: TimetableBlock, now: Date): "past" | "current" | "upcoming" {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= toMinutes(block.end)) return "past";
  if (minutes >= toMinutes(block.start)) return "current";
  return "upcoming";
}

function formatRange(block: TimetableBlock): string {
  const fmt = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  };
  return `${fmt(block.start)} – ${fmt(block.end)}`;
}

export function TimetablePage() {
  const now = useNow(30_000);
  const { logs, toggleTask } = useData();
  const today = todayISO();
  const log = getLog(logs, today);
  const weekday = now.getDay();

  return (
    <div>
      <PageHeader
        title="Daily Timetable"
        description={`${WEEKDAY_NAMES[weekday]}'s battle plan — check tasks off as you go.`}
      />

      <div className="relative space-y-4 pl-6 sm:pl-8">
        {/* timeline spine */}
        <div className="absolute bottom-4 left-[5px] top-2 w-px bg-gradient-to-b from-violet-500/60 via-border to-border" aria-hidden />

        {TIMETABLE.map((block, index) => {
          const state = blockState(block, now);
          const done = block.tasks.filter((task) => log.tasks[task.id]).length;
          const pct = (done / block.tasks.length) * 100;
          const focus = block.byWeekday?.[weekday];

          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              className="relative"
            >
              {/* timeline node */}
              <div
                className={cn(
                  "absolute -left-6 top-6 h-3 w-3 rounded-full border-2 sm:-left-8",
                  state === "current"
                    ? "border-primary bg-primary shadow-glow-violet"
                    : state === "past"
                      ? "border-muted-foreground/40 bg-muted"
                      : "border-border bg-background",
                )}
                aria-hidden
              />

              <div
                className={cn(
                  "glass glass-hover rounded-xl p-5 transition-shadow",
                  state === "current" && "border-primary/40 shadow-glow-violet",
                  state === "past" && pct === 100 && "opacity-70",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${block.accent}22`, color: block.accent }}
                    >
                      <DynamicIcon name={block.icon} className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{block.title}</h3>
                        {state === "current" && <Badge>Now</Badge>}
                        {focus && <Badge variant="info">{focus}</Badge>}
                      </div>
                      <p className="tabular mt-0.5 text-xs text-muted-foreground">{formatRange(block)}</p>
                      {block.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{block.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="tabular text-xs font-medium text-muted-foreground">
                    {done}/{block.tasks.length}
                  </div>
                </div>

                <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
                  {block.tasks.map((task) => {
                    const checked = Boolean(log.tasks[task.id]);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left text-sm transition-colors hover:border-white/[0.08] hover:bg-white/[0.04]",
                          checked && "text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors",
                            checked
                              ? "border-transparent bg-gradient-to-br from-violet-500 to-cyan-400"
                              : "border-muted-foreground/40 group-hover:border-primary/60",
                          )}
                        >
                          {checked && <Check className="h-3 w-3 text-white" />}
                        </span>
                        <span className={cn(checked && "line-through decoration-muted-foreground/50")}>
                          {task.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Progress value={pct} color={block.accent} className="mt-4 h-1" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
