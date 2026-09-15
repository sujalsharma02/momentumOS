import { Check, Minus, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useData } from "@/context/DataContext";
import { CATEGORY_META } from "@/data/defaultPlan";
import { PRIORITY_META } from "@/data/pipeline";
import { useNow } from "@/hooks/useNow";
import { formatLongDate, todayISO } from "@/lib/dates";
import { counterValue, dayCompletion, getLog } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { PlanBlock } from "@/types";
import { BlockDialog } from "@/features/today/BlockDialog";
import { CounterRow } from "@/features/today/CounterRow";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

type BlockState = "past" | "current" | "upcoming";

function blockState(block: PlanBlock, now: Date): BlockState {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= toMinutes(block.end)) return "past";
  if (minutes >= toMinutes(block.start)) return "current";
  return "upcoming";
}

export function TodayPage() {
  const now = useNow(30_000);
  const { plan, dayLogs, loadDemoData, hasAnyData } = useData();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const today = todayISO();
  const log = getLog(dayLogs.logs, today);
  const weekday = now.getDay();

  const [editMode, setEditMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlanBlock | null>(null);

  const completion = dayCompletion(dayLogs.logs, today, plan.taskIds);
  const doneCount = plan.taskIds.filter((id) => log.tasks[id]).length;
  const currentBlock = plan.blocks.find((block) => blockState(block, now) === "current");
  const nextBlock = plan.blocks.find((block) => blockState(block, now) === "upcoming");
  const priorities = plan.blocks.filter((block) => block.priority === "high");

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (block: PlanBlock) => {
    setEditing(block);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Today"
        description={formatLongDate(now)}
        actions={
          <>
            {editMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  confirm({
                    title: "Reset to the default plan?",
                    description: "Your custom blocks will be replaced. Past days keep their history.",
                    confirmLabel: "Reset plan",
                    onConfirm: plan.resetToDefault,
                  })
                }
              >
                <RotateCcw /> Reset
              </Button>
            )}
            <Button variant={editMode ? "secondary" : "outline"} size="sm" onClick={() => setEditMode((v) => !v)}>
              <Pencil /> {editMode ? "Done editing" : "Edit plan"}
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus /> Add block
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr,300px]">
        {/* Timeline */}
        <div className="min-w-0">
          {plan.blocks.length === 0 ? (
            <EmptyState
              icon="CalendarClock"
              title="No blocks in today's plan"
              description="A day plan is a handful of time blocks, each with a short checklist. Add your own, or restore the default plan built around deep work, job search and interview prep."
              action={
                <>
                  <Button onClick={openCreate}>
                    <Plus /> Add block
                  </Button>
                  <Button variant="outline" onClick={plan.resetToDefault}>
                    Restore default plan
                  </Button>
                </>
              }
            />
          ) : (
            <div className="relative space-y-2 pl-5">
              <div className="absolute bottom-3 left-[5px] top-3 w-px bg-border" aria-hidden />
              {plan.blocks.map((block) => {
                const state = blockState(block, now);
                const meta = CATEGORY_META[block.category];
                const done = block.tasks.filter((task) => log.tasks[task.id]).length;
                const focus = block.byWeekday?.[weekday];
                const counterVal = block.counter ? counterValue(dayLogs.logs, today, block.counter) : null;

                return (
                  <div key={block.id} className="relative">
                    <div
                      className={cn(
                        "absolute -left-5 top-4 h-[11px] w-[11px] rounded-full border-2 bg-background",
                        state === "current"
                          ? "border-primary bg-primary"
                          : state === "past"
                            ? "border-muted-foreground/40"
                            : "border-border",
                      )}
                      aria-hidden
                    />
                    <div
                      className={cn(
                        "surface p-3.5 transition-colors",
                        state === "current" && "border-primary/50",
                        state === "past" && done === block.tasks.length && block.tasks.length > 0 && "opacity-60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <div
                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                            style={{ backgroundColor: `${meta.accent}1f`, color: meta.accent }}
                          >
                            <DynamicIcon name={meta.icon} className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="text-sm font-semibold">{block.title}</h3>
                              {state === "current" && <Badge>Now</Badge>}
                              {block.priority === "high" && (
                                <Badge variant="outline" className="border-transparent px-0 text-[10px]">
                                  <span
                                    className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                                    style={{ backgroundColor: PRIORITY_META.high.accent }}
                                  />
                                  High priority
                                </Badge>
                              )}
                              {focus && <Badge variant="info">{focus}</Badge>}
                            </div>
                            <p className="tabular mt-0.5 text-xs text-muted-foreground">
                              {formatTime(block.start)} – {formatTime(block.end)}
                              <span className="mx-1.5">·</span>
                              {meta.label}
                              {block.description && (
                                <>
                                  <span className="mx-1.5">·</span>
                                  {block.description}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {block.tasks.length > 0 && (
                            <span className="tabular text-xs text-muted-foreground">
                              {done}/{block.tasks.length}
                            </span>
                          )}
                          {editMode && (
                            <>
                              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(block)} aria-label={`Edit ${block.title}`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="hover:text-destructive"
                                onClick={() =>
                                  confirm({
                                    title: `Remove "${block.title}"?`,
                                    description: "Past days keep their record of this block.",
                                    confirmLabel: "Remove",
                                    onConfirm: () => plan.removeBlock(block.id),
                                  })
                                }
                                aria-label={`Remove ${block.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {(block.tasks.length > 0 || counterVal !== null) && (
                        <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-2">
                          {block.tasks.length > 0 && (
                            <div className="grid flex-1 gap-0.5 sm:grid-cols-2">
                              {block.tasks.map((task) => {
                                const checked = Boolean(log.tasks[task.id]);
                                return (
                                  <button
                                    key={task.id}
                                    type="button"
                                    onClick={() => dayLogs.toggleTask(task.id)}
                                    className={cn(
                                      "group flex items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm transition-colors hover:bg-elevated",
                                      checked && "text-muted-foreground",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                        checked
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-muted-foreground/40 group-hover:border-primary",
                                      )}
                                    >
                                      {checked && <Check className="h-3 w-3" />}
                                    </span>
                                    <span className={cn(checked && "line-through decoration-muted-foreground/50")}>
                                      {task.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {block.counter && counterVal !== null && (
                            <div className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs">
                              <span className="tabular font-semibold">{counterVal}</span>
                              <span className="text-muted-foreground">logged</span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-6 w-6"
                                onClick={() => dayLogs.adjustCounter(block.counter!, -1)}
                                aria-label="Decrease"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-6 w-6"
                                onClick={() => dayLogs.adjustCounter(block.counter!, 1)}
                                aria-label="Increase"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <ProgressRing value={completion} size={88} strokeWidth={7} />
              <div className="min-w-0 text-sm">
                <div className="font-semibold">
                  {doneCount} of {plan.taskIds.length} done
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {currentBlock ? (
                    <>
                      Now: <span className="text-foreground">{currentBlock.title}</span>
                    </>
                  ) : nextBlock ? (
                    <>
                      Next: <span className="text-foreground">{nextBlock.title}</span> at{" "}
                      {formatTime(nextBlock.start)}
                    </>
                  ) : (
                    "Plan complete for today"
                  )}
                </div>
                {!hasAnyData && (
                  <button
                    type="button"
                    onClick={loadDemoData}
                    className="mt-1.5 text-xs text-primary underline-offset-2 hover:underline"
                  >
                    Load a sample month
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Log today</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              <CounterRow counter="applications" label="Applications" />
              <CounterRow counter="recruiters" label="Recruiter conversations" />
              <CounterRow counter="dsa" label="Problems solved" />
              <CounterRow counter="studyHours" label="Study hours" step={0.5} unit="h" />
              <CounterRow counter="commits" label="Commits" />
            </CardContent>
          </Card>

          {priorities.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Priorities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {priorities.map((block) => {
                  const done = block.tasks.filter((task) => log.tasks[task.id]).length;
                  const complete = block.tasks.length > 0 && done === block.tasks.length;
                  return (
                    <div key={block.id} className="flex items-center justify-between text-sm">
                      <span className={cn(complete && "text-muted-foreground line-through")}>{block.title}</span>
                      <span className="tabular text-xs text-muted-foreground">
                        {formatTime(block.start)}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(values) => {
          if (editing) plan.updateBlock(editing.id, values);
          else plan.addBlock(values);
        }}
      />
      {confirmDialog}
    </div>
  );
}
