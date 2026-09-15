import { CheckCircle2, Lock, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Stat, StatStrip } from "@/components/shared/Stat";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/context/DataContext";
import { DEFAULT_GOALS, GOAL_CATEGORY_META } from "@/data/goals";
import { PREP_TOPICS } from "@/data/prepTopics";
import { todayISO } from "@/lib/dates";
import { computeAchievements, goalValue, skillStats } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { GOAL_CATEGORIES, type Goal, type GoalPeriod } from "@/types";
import { GoalDialog } from "@/features/goals/GoalDialog";

function GoalRow({
  goal,
  value,
  editable,
  onAdjust,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  value: number;
  editable: boolean;
  onAdjust?: (delta: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = Math.min(100, (value / goal.target) * 100);
  const done = value >= goal.target;
  const meta = GOAL_CATEGORY_META[goal.category];

  return (
    <div className="group flex items-center gap-3 py-2">
      <span className="h-6 w-1 shrink-0 rounded-full" style={{ backgroundColor: meta.accent }} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className={cn("truncate font-medium", done && "text-emerald-600 dark:text-emerald-400")}>
            {done && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}
            {goal.label}
          </span>
          <span className="tabular shrink-0 text-xs text-muted-foreground">
            {value} / {goal.target}
          </span>
        </div>
        <Progress value={pct} className="mt-1.5 h-1" color={done ? "#0ca30c" : meta.accent} />
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {onAdjust && (
          <>
            <Button variant="ghost" size="icon-sm" onClick={() => onAdjust(-1)} aria-label={`Decrease ${goal.label}`}>
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => onAdjust(1)} aria-label={`Increase ${goal.label}`}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        {editable && (
          <div className="ml-1 flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${goal.label}`}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="hover:text-destructive" onClick={onDelete} aria-label={`Delete ${goal.label}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function GoalsPage() {
  const { goals, dayLogs, applications, engineeringLog, plan, prep } = useData();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const today = todayISO();
  const [period, setPeriod] = useState<GoalPeriod>("daily");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const byPeriod = useMemo(
    () => ({
      daily: goals.items.filter((g) => g.period === "daily"),
      weekly: goals.items.filter((g) => g.period === "weekly"),
      monthly: goals.items.filter((g) => g.period === "monthly"),
    }),
    [goals.items],
  );

  const metCount = (list: Goal[]) => list.filter((g) => goalValue(g, dayLogs.logs, today) >= g.target).length;

  const achievements = useMemo(
    () =>
      computeAchievements({
        logs: dayLogs.logs,
        applications: applications.items,
        entries: engineeringLog.items,
        planIds: plan.taskIds,
      }),
    [dayLogs.logs, applications.items, engineeringLog.items, plan.taskIds],
  );
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const skills = useMemo(() => skillStats(PREP_TOPICS, prep.progress), [prep.progress]);

  const current = byPeriod[period];
  const grouped = GOAL_CATEGORIES.map((category) => ({
    category,
    goals: current.filter((g) => g.category === category),
  })).filter((group) => group.goals.length > 0);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Targets measured against what you log. Daily ones reset each day; weekly and monthly roll up automatically."
        actions={
          <>
            {goals.items.length === 0 && (
              <Button variant="outline" size="sm" onClick={() => goals.replace(DEFAULT_GOALS)}>
                Restore defaults
              </Button>
            )}
            <Button size="sm" onClick={openCreate}>
              <Plus /> Add goal
            </Button>
          </>
        }
      />

      <StatStrip className="mb-4">
        <Stat label="Today" value={`${metCount(byPeriod.daily)}/${byPeriod.daily.length}`} detail="daily goals met" />
        <Stat label="This week" value={`${metCount(byPeriod.weekly)}/${byPeriod.weekly.length}`} detail="weekly goals met" />
        <Stat label="This month" value={`${metCount(byPeriod.monthly)}/${byPeriod.monthly.length}`} detail="monthly goals met" />
        <Stat label="Interview readiness" value={`${skills.readiness}%`} detail={`${skills.weak.length} weak topic${skills.weak.length === 1 ? "" : "s"}`} />
        <Stat label="Achievements" value={`${unlocked}/${achievements.length}`} />
      </StatStrip>

      <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
        <div>
          <Tabs value={period} onValueChange={(value) => setPeriod(value as GoalPeriod)}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>

          {current.length === 0 ? (
            <EmptyState
              compact
              className="mt-3"
              icon="Target"
              title={`No ${period} goals`}
              description="Add a target measured by one of the counters you log on the Today page."
              action={
                <Button size="sm" onClick={openCreate}>
                  <Plus /> Add goal
                </Button>
              }
            />
          ) : (
            <div className="mt-3 space-y-4">
              {grouped.map(({ category, goals: list }) => {
                const meta = GOAL_CATEGORY_META[category];
                return (
                  <section key={category} className="surface px-4 py-2">
                    <div className="flex items-center gap-2 py-1.5">
                      <DynamicIcon name={meta.icon} className="h-3.5 w-3.5" style={{ color: meta.accent }} />
                      <span className="text-xs font-semibold">{meta.label}</span>
                      <span className="text-[11px] text-muted-foreground">{meta.description}</span>
                    </div>
                    <div className="divide-y divide-border/60">
                      {list.map((goal) => (
                        <GoalRow
                          key={goal.id}
                          goal={goal}
                          value={goalValue(goal, dayLogs.logs, today)}
                          editable
                          onAdjust={period === "daily" ? (delta) => dayLogs.adjustCounter(goal.counter, delta) : undefined}
                          onEdit={() => openEdit(goal)}
                          onDelete={() =>
                            confirm({
                              title: `Delete "${goal.label}"?`,
                              description: "Only the goal is removed; what you logged stays.",
                              onConfirm: () => goals.remove(goal.id),
                            })
                          }
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
              {period !== "daily" && (
                <p className="text-xs text-muted-foreground">
                  {period === "weekly" ? "Weeks run Monday to Sunday." : "Months follow the calendar."} Values come from your daily logs.
                </p>
              )}
            </div>
          )}
        </div>

        <aside>
          <SectionHeading title="Achievements" count={unlocked} />
          <div className="surface divide-y divide-border/60">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={cn("flex items-center gap-3 px-3 py-2", !achievement.unlocked && "opacity-50")}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    achievement.unlocked ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {achievement.unlocked ? (
                    <DynamicIcon name={achievement.icon} className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium">{achievement.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(values) => {
          if (editing) goals.update(editing.id, values);
          else goals.create(values);
        }}
      />
      {confirmDialog}
    </div>
  );
}
