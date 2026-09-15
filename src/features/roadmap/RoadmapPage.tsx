import { ArrowDown, ArrowUp, Check, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/context/DataContext";
import { DEFAULT_ROADMAP } from "@/data/roadmap";
import { formatMediumDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/types";
import { MILESTONE_STATUS_META, MilestoneDialog } from "@/features/roadmap/MilestoneDialog";

export function RoadmapPage() {
  const { roadmap } = useData();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);

  const milestones = roadmap.items;
  const doneCount = milestones.filter((m) => m.status === "done").length;
  const activeIndex = milestones.findIndex((m) => m.status === "active");

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= milestones.length) return;
    roadmap.replace((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (m: Milestone) => {
    setEditing(m);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Career Roadmap"
        description="Where this is going, one milestone at a time. A plan to revise, not a forecast."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                confirm({
                  title: "Restore the default roadmap?",
                  description: "Your milestones will be replaced with the default path.",
                  confirmLabel: "Restore",
                  onConfirm: () => roadmap.replace(DEFAULT_ROADMAP),
                })
              }
            >
              <RotateCcw /> Restore default
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus /> Add milestone
            </Button>
          </>
        }
      />

      {milestones.length === 0 ? (
        <EmptyState
          icon="Route"
          title="No milestones"
          description="A roadmap is a short ordered list of what has to happen between here and the career you want. Add the next step, or restore the default path to abroad."
          action={
            <>
              <Button onClick={openCreate}>
                <Plus /> Add milestone
              </Button>
              <Button variant="outline" onClick={() => roadmap.replace(DEFAULT_ROADMAP)}>
                Restore default
              </Button>
            </>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
          <ol className="relative space-y-3 pl-8">
            <div className="absolute bottom-6 left-[11px] top-6 w-px bg-border" aria-hidden />
            {milestones.map((m, index) => {
              const meta = MILESTONE_STATUS_META[m.status];
              const isPast = m.status === "done";
              const isCurrent = m.status === "active";
              return (
                <li key={m.id} className="relative">
                  <div
                    className={cn(
                      "absolute -left-8 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background text-[11px] font-semibold",
                      isPast
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isCurrent
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {isPast ? <Check className="h-3 w-3" /> : index + 1}
                  </div>
                  <div
                    className={cn(
                      "surface group p-4",
                      isCurrent && "border-primary/50",
                      isPast && "opacity-70",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">{m.title}</h3>
                          <span className="text-[11px] font-medium" style={{ color: meta.accent }}>
                            {meta.label}
                          </span>
                          {m.targetDate && (
                            <span className="tabular text-[11px] text-muted-foreground">
                              target {formatMediumDate(m.targetDate)}
                            </span>
                          )}
                        </div>
                        {m.detail && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.detail}</p>}
                        {m.notes && (
                          <p className="surface-muted mt-2 px-2.5 py-1.5 text-xs text-muted-foreground">{m.notes}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <Button variant="ghost" size="icon-sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => move(index, 1)} disabled={index === milestones.length - 1} aria-label="Move down">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(m)} aria-label="Edit milestone">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="hover:text-destructive"
                          onClick={() =>
                            confirm({
                              title: `Remove "${m.title}"?`,
                              onConfirm: () => roadmap.remove(m.id),
                            })
                          }
                          aria-label="Remove milestone"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {!isPast && (
                      <div className="mt-3 flex items-center gap-2">
                        <Progress value={m.progress} className="h-1 flex-1" color={meta.accent} />
                        <span className="tabular w-8 text-right text-[11px] text-muted-foreground">{m.progress}%</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <aside className="space-y-4">
            <div className="surface p-4">
              <h3 className="eyebrow mb-2">Position</h3>
              <div className="tabular text-2xl font-semibold">
                {doneCount} <span className="text-sm font-normal text-muted-foreground">of {milestones.length} reached</span>
              </div>
              {activeIndex >= 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Currently working on <span className="font-medium text-foreground">{milestones[activeIndex].title}</span>.
                </p>
              )}
            </div>
            <div className="surface p-4 text-xs leading-relaxed text-muted-foreground">
              <h3 className="eyebrow mb-2">How to use this</h3>
              <p>
                Keep one milestone active. Mark it done when the concrete thing has happened - an offer
                signed, a visa granted - not when it feels close. Revisit the rest every few months; the
                order will change as you learn more.
              </p>
            </div>
          </aside>
        </div>
      )}

      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(values) => {
          if (editing) roadmap.update(editing.id, values);
          else roadmap.create(values);
        }}
      />
      {confirmDialog}
    </div>
  );
}
