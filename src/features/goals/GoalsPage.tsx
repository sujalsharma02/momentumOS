import { motion } from "framer-motion";
import { CheckCircle2, Lock, Minus, Plus } from "lucide-react";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/context/DataContext";
import { DAILY_GOALS, WEEKLY_GOALS } from "@/data/goals";
import { todayISO } from "@/lib/dates";
import { computeAchievements, counterValue, weeklyCounter } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { Goal } from "@/types";

function GoalRow({ goal, value, onAdjust }: { goal: Goal; value: number; onAdjust?: (delta: number) => void }) {
  const pct = Math.min(100, (value / goal.target) * 100);
  const done = value >= goal.target;

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className={cn("font-medium", done && "text-emerald-400")}>
            {done && <CheckCircle2 className="mr-1.5 inline h-4 w-4" />}
            {goal.label}
          </span>
          <span className="tabular text-muted-foreground">
            {value} / {goal.target}
          </span>
        </div>
        <Progress
          value={pct}
          className="mt-2"
          color={done ? "#34d399" : undefined}
        />
      </div>
      {onAdjust && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAdjust(-1)} aria-label={`Decrease ${goal.label}`}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAdjust(1)} aria-label={`Increase ${goal.label}`}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function GoalsPage() {
  const { logs, applications, adjustCounter } = useData();
  const today = todayISO();

  const dailyDone = DAILY_GOALS.filter((g) => counterValue(logs, today, g.counter) >= g.target).length;
  const weeklyDone = WEEKLY_GOALS.filter((g) => weeklyCounter(logs, g.counter) >= g.target).length;
  const achievements = computeAchievements(logs, applications);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Daily reps compound into weekly wins. Weekly wins compound into a new life."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Daily goals</CardTitle>
            <span className="tabular text-sm text-muted-foreground">
              {dailyDone}/{DAILY_GOALS.length} complete
            </span>
          </CardHeader>
          <CardContent className="space-y-5">
            {DAILY_GOALS.map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                value={counterValue(logs, today, goal.counter)}
                onAdjust={(delta) => adjustCounter(goal.counter, delta)}
              />
            ))}
            {dailyDone === DAILY_GOALS.length && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-400"
              >
                🎉 All daily goals crushed. Tomorrow, we go again.
              </motion.p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Weekly goals</CardTitle>
            <span className="tabular text-sm text-muted-foreground">
              {weeklyDone}/{WEEKLY_GOALS.length} complete
            </span>
          </CardHeader>
          <CardContent className="space-y-5">
            {WEEKLY_GOALS.map((goal) => (
              <GoalRow key={goal.id} goal={goal} value={weeklyCounter(logs, goal.counter)} />
            ))}
            <p className="text-xs text-muted-foreground">
              Weekly totals aggregate automatically from your daily logs (Monday–Sunday).
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Achievements
          </h2>
          <span className="tabular text-sm text-muted-foreground">
            {unlockedCount}/{achievements.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={cn(
                "glass rounded-xl p-4 text-center",
                achievement.unlocked
                  ? "border-primary/30"
                  : "opacity-50 grayscale",
              )}
            >
              <div
                className={cn(
                  "mx-auto flex h-10 w-10 items-center justify-center rounded-full",
                  achievement.unlocked
                    ? "bg-gradient-to-br from-violet-500/30 to-cyan-400/30 text-primary"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {achievement.unlocked ? (
                  <DynamicIcon name={achievement.icon} className="h-5 w-5" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              <div className="mt-2 text-sm font-semibold">{achievement.title}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                {achievement.description}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
