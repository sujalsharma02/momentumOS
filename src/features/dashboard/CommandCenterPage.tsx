import { ArrowRight, Check, Flame } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { CATEGORY_META } from "@/data/defaultPlan";
import { LOG_CATEGORY_META, STATUS_META } from "@/data/pipeline";
import { PREP_TOPICS } from "@/data/prepTopics";
import { PROJECT_STATUS_META } from "@/data/projects";
import { useNow } from "@/hooks/useNow";
import { formatLongDate, formatMediumDate, formatShortDay, todayISO } from "@/lib/dates";
import { currentStreak, dailyGoalsMet, dayCompletion, getLog, goalsForPeriod, pipelineStats, skillStats } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { PlanBlock } from "@/types";
import { DirectionCard } from "@/features/dashboard/DirectionCard";
import { STRENGTH_META } from "@/features/prep/TopicDialog";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${period}`;
}

function CardLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
      {children} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

export function CommandCenterPage() {
  const now = useNow(1000);
  const { plan, dayLogs, applications, projects, engineeringLog, goals, prep, roadmap, hasAnyData, loadDemoData } = useData();
  const today = todayISO();
  const log = getLog(dayLogs.logs, today);

  const completion = dayCompletion(dayLogs.logs, today, plan.taskIds);
  const streak = currentStreak(dayLogs.logs, plan.taskIds);
  const dailyGoals = goalsForPeriod(goals.items, "daily");
  const goalsMet = dailyGoalsMet(goals.items, dayLogs.logs, today);

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const currentBlock = plan.blocks.find((b) => minutesNow >= toMinutes(b.start) && minutesNow < toMinutes(b.end));
  const nextBlock = plan.blocks.find((b) => minutesNow < toMinutes(b.start));
  const activeMilestone = roadmap.items.find((m) => m.status === "active");

  const pipeline = useMemo(() => pipelineStats(applications.items, today), [applications.items, today]);
  const skills = useMemo(() => skillStats(PREP_TOPICS, prep.progress), [prep.progress]);

  const priorityBlocks: PlanBlock[] = plan.blocks.filter((b) => b.priority === "high");
  const doneTasks = plan.taskIds.filter((id) => log.tasks[id]).length;
  const remainingTasks = plan.taskIds.length - doneTasks;

  const activeProjects = projects.items.filter((p) => p.status === "building" || p.status === "maintaining").slice(0, 4);
  const recentLog = engineeringLog.items.slice(0, 4);
  const roadmapReached = roadmap.items.filter((m) => m.status === "done").length;
  const roadmapPct = roadmap.items.length === 0 ? 0 : Math.round((roadmapReached / roadmap.items.length) * 100);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-4">
      {/* Top strip */}
      <section className="surface flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{formatLongDate(now)}</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">{greeting}.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentBlock ? (
              <>
                Now: <span className="font-medium text-foreground">{currentBlock.title}</span>
                {currentBlock.byWeekday?.[now.getDay()] && <> · {currentBlock.byWeekday[now.getDay()]}</>}
              </>
            ) : nextBlock ? (
              <>
                Next: <span className="font-medium text-foreground">{nextBlock.title}</span> at {formatTime(nextBlock.start)}
              </>
            ) : activeMilestone ? (
              <>
                Working toward <span className="font-medium text-foreground">{activeMilestone.title}</span>
              </>
            ) : (
              "Nothing scheduled. Pick one thing."
            )}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-x-5 gap-y-3 sm:grid-cols-5 lg:flex lg:gap-8">
          <div className="tabular">
            <div className="eyebrow">Time</div>
            <div className="mt-0.5 text-lg font-semibold leading-none">
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </div>
          </div>
          <div className="tabular">
            <div className="eyebrow">Streak</div>
            <div className={cn("mt-0.5 flex items-center gap-1 text-lg font-semibold leading-none", streak > 0 && "text-orange-500")}>
              <Flame className="h-4 w-4" /> {streak}
            </div>
          </div>
          <div className="tabular">
            <div className="eyebrow">Today</div>
            <div className="mt-0.5 text-lg font-semibold leading-none">{completion}%</div>
          </div>
          <div className="tabular">
            <div className="eyebrow">Goals</div>
            <div className="mt-0.5 text-lg font-semibold leading-none">
              {goalsMet}<span className="text-sm text-muted-foreground">/{dailyGoals.length}</span>
            </div>
          </div>
          <div className="tabular">
            <div className="eyebrow">Roadmap</div>
            <div className="mt-0.5 text-lg font-semibold leading-none">{roadmapPct}%</div>
          </div>
        </div>
      </section>

      {!hasAnyData && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Fresh install. Start on <Link to="/today" className="text-foreground underline-offset-2 hover:underline">Today</Link>, or load a realistic sample month to explore every page.
          </span>
          <Button size="sm" variant="outline" onClick={loadDemoData}>
            Load demo data
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* A. Today */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>Today</CardTitle>
            <CardLink to="/today">Open plan</CardLink>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="flex items-center gap-4">
              <ProgressRing value={completion} size={72} strokeWidth={6} />
              <div className="text-sm">
                <div>
                  <span className="tabular font-semibold">{doneTasks}</span> done ·{" "}
                  <span className="tabular font-semibold">{remainingTasks}</span> remaining
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {currentBlock
                    ? `In ${currentBlock.title} until ${formatTime(currentBlock.end)}`
                    : nextBlock
                      ? `Next: ${nextBlock.title} at ${formatTime(nextBlock.start)}`
                      : "Plan finished for today"}
                </div>
              </div>
            </div>
            {priorityBlocks.length > 0 && (
              <div>
                <div className="eyebrow mb-1">Priorities</div>
                <ul className="space-y-1">
                  {priorityBlocks.map((block) => {
                    const done = block.tasks.filter((t) => log.tasks[t.id]).length;
                    const complete = block.tasks.length > 0 && done === block.tasks.length;
                    const meta = CATEGORY_META[block.category];
                    return (
                      <li key={block.id} className="flex items-center gap-2 text-sm">
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            complete ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40",
                          )}
                        >
                          {complete && <Check className="h-3 w-3" />}
                        </span>
                        <span className={cn("flex-1 truncate", complete && "text-muted-foreground line-through")}>{block.title}</span>
                        <span className="text-[11px]" style={{ color: meta.accent }}>
                          {done}/{block.tasks.length}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* B. Career pipeline */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>Career pipeline</CardTitle>
            <CardLink to="/tracker">Tracker</CardLink>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="eyebrow">This month</div>
                <div className="tabular mt-0.5 text-xl font-semibold">{pipeline.appliedThisMonth}</div>
              </div>
              <div>
                <div className="eyebrow">Active</div>
                <div className="tabular mt-0.5 text-xl font-semibold">{pipeline.active}</div>
              </div>
              <div>
                <div className="eyebrow">Response</div>
                <div className="tabular mt-0.5 text-xl font-semibold">{pipeline.responseRate}%</div>
              </div>
              <div>
                <div className="eyebrow">Interviews</div>
                <div className="tabular mt-0.5 text-xl font-semibold" style={{ color: STATUS_META.interview.accent }}>
                  {pipeline.interviewed}
                </div>
              </div>
              <div>
                <div className="eyebrow">Offers</div>
                <div className="tabular mt-0.5 text-xl font-semibold" style={{ color: STATUS_META.offer.accent }}>
                  {pipeline.offers}
                </div>
              </div>
              <div>
                <div className="eyebrow">Follow-ups</div>
                <div className={cn("tabular mt-0.5 text-xl font-semibold", pipeline.followUpsDue.length > 0 && "text-amber-600 dark:text-amber-400")}>
                  {pipeline.followUpsDue.length}
                </div>
              </div>
            </div>
            {(pipeline.followUpsDue.length > 0 || pipeline.upcomingInterviews.length > 0) && (
              <ul className="space-y-1 border-t border-border pt-3 text-sm">
                {pipeline.upcomingInterviews.slice(0, 2).map((app) => (
                  <li key={app.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      <Badge variant="warning" className="mr-1.5">Interview</Badge>
                      {app.company}
                    </span>
                    <span className="tabular shrink-0 text-xs text-muted-foreground">{app.interviewDate && formatShortDay(app.interviewDate)}</span>
                  </li>
                ))}
                {pipeline.followUpsDue.slice(0, 2).map((app) => (
                  <li key={app.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      <Badge variant="outline" className="mr-1.5">Follow up</Badge>
                      {app.company}
                    </span>
                    <span className="tabular shrink-0 text-xs text-muted-foreground">{app.followUpDate && formatShortDay(app.followUpDate)}</span>
                  </li>
                ))}
              </ul>
            )}
            {applications.items.length === 0 && (
              <p className="text-xs text-muted-foreground">No applications tracked yet.</p>
            )}
          </CardContent>
        </Card>

        {/* C. Building */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>Building</CardTitle>
            <CardLink to="/projects">Projects</CardLink>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            {activeProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground">No active projects. Add what you are building.</p>
            ) : (
              <ul className="space-y-1.5">
                {activeProjects.map((project) => {
                  const meta = PROJECT_STATUS_META[project.status];
                  const open = project.tasks.filter((t) => !t.done).length;
                  return (
                    <li key={project.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: meta.accent }} />
                        <span className="truncate font-medium">{project.name}</span>
                      </span>
                      <span className="tabular shrink-0 text-xs text-muted-foreground">
                        {meta.label}
                        {open > 0 && ` · ${open} open`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="border-t border-border pt-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="eyebrow">Latest engineering</span>
                <Link to="/log" className="text-[11px] text-muted-foreground hover:text-foreground">
                  Log
                </Link>
              </div>
              {recentLog.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing logged yet.</p>
              ) : (
                <ul className="space-y-1">
                  {recentLog.map((entry) => {
                    const meta = LOG_CATEGORY_META[entry.category];
                    return (
                      <li key={entry.id} className="flex items-center gap-2 text-xs">
                        <DynamicIcon name={meta.icon} className="h-3 w-3 shrink-0" style={{ color: meta.accent }} />
                        <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                        <span className="tabular shrink-0 text-muted-foreground">{formatShortDay(entry.date)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* D. Skill growth */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>Skill growth</CardTitle>
            <CardLink to="/prep">Interview prep</CardLink>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="flex items-center gap-4">
              <ProgressRing value={skills.readiness} size={72} strokeWidth={6} color="#7c6cf0" />
              <div className="text-sm">
                <div className="font-semibold">Interview readiness</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {skills.rated} of {skills.total} topics rated · {skills.strong.length} strong
                </div>
              </div>
            </div>
            {skills.weak.length > 0 && (
              <div>
                <div className="eyebrow mb-1" style={{ color: STRENGTH_META.weak.accent }}>Weak areas</div>
                <div className="flex flex-wrap gap-1">
                  {skills.weak.slice(0, 6).map((topic) => (
                    <span key={topic.id} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium">
                      {topic.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {skills.recentlyStudied.length > 0 && (
              <div className="border-t border-border pt-3">
                <div className="eyebrow mb-1">Recently studied</div>
                <ul className="space-y-0.5">
                  {skills.recentlyStudied.slice(0, 4).map(({ topic, lastStudied }) => (
                    <li key={topic.id} className="flex items-center justify-between text-xs">
                      <span>{topic.title}</span>
                      <span className="tabular text-muted-foreground">{formatShortDay(lastStudied)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {skills.rated === 0 && (
              <p className="text-xs text-muted-foreground">Nothing rated yet. Open a topic and set a readiness level.</p>
            )}
          </CardContent>
        </Card>

        {/* E. Direction */}
        <DirectionCard />

        {/* F. Daily goals */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>Daily goals</CardTitle>
            <CardLink to="/goals">Goals</CardLink>
          </CardHeader>
          <CardContent className="flex-1">
            {dailyGoals.length === 0 ? (
              <p className="text-xs text-muted-foreground">No daily goals set.</p>
            ) : (
              <ul className="space-y-1.5">
                {dailyGoals.slice(0, 6).map((goal) => {
                  const value = log.counters[goal.counter] ?? 0;
                  const met = value >= goal.target;
                  return (
                    <li key={goal.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          met ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40",
                        )}
                      >
                        {met && <Check className="h-3 w-3" />}
                      </span>
                      <span className={cn("flex-1 truncate", met && "text-muted-foreground")}>{goal.label}</span>
                      <span className="tabular text-xs text-muted-foreground">
                        {value}/{goal.target}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {pipeline.upcomingInterviews[0] && (
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                Next interview: <span className="font-medium text-foreground">{pipeline.upcomingInterviews[0].company}</span>,{" "}
                {pipeline.upcomingInterviews[0].interviewDate && formatMediumDate(pipeline.upcomingInterviews[0].interviewDate)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
