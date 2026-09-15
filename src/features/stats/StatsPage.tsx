import { useCallback, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Stat, StatStrip } from "@/components/shared/Stat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { LOG_CATEGORY_META } from "@/data/pipeline";
import { PREP_TOPICS } from "@/data/prepTopics";
import { formatShortDay, lastNDays, parseISODate, startOfWeekISO, todayISO } from "@/lib/dates";
import { counterValue, currentStreak, dayCompletion, pipelineStats, skillStats, sumCounter } from "@/lib/stats";
import { LOG_CATEGORIES } from "@/types";
import { AXIS_TICK, ChartCard, ChartTooltip, GRID_STROKE, SERIES } from "@/features/stats/ChartCard";
import { Funnel } from "@/features/tracker/Funnel";

type Range = 14 | 30 | 90;

const axisProps = { tick: AXIS_TICK, tickLine: false, axisLine: false } as const;
const margin = { top: 8, right: 8, left: -4, bottom: 0 };

export function StatsPage() {
  const { dayLogs, applications, engineeringLog, focus, projects, plan, prep, hasAnyData, loadDemoData } = useData();
  const [range, setRange] = useState<Range>(30);
  const today = todayISO();
  const logs = dayLogs.logs;

  const days = useMemo(() => lastNDays(range), [range]);
  const rangeStart = days[0];
  const inRange = useCallback(
    (date: string) => date >= rangeStart && date <= today,
    [rangeStart, today],
  );

  // Per-day series across the selected range.
  const daily = useMemo(
    () =>
      days.map((date) => ({
        date,
        day: formatShortDay(date),
        applications: counterValue(logs, date, "applications"),
        study: counterValue(logs, date, "studyHours"),
        dsa: counterValue(logs, date, "dsa"),
        focus: counterValue(logs, date, "focusMinutes"),
        commits: counterValue(logs, date, "commits"),
        completion: dayCompletion(logs, date, plan.taskIds),
      })),
    [days, logs, plan.taskIds],
  );

  // Weekly buckets for events that happen a few times a month, not daily.
  const weekly = useMemo(() => {
    const buckets = new Map<string, { applied: number; interviews: number; log: number }>();
    for (const date of days) {
      const week = startOfWeekISO(parseISODate(date));
      if (!buckets.has(week)) buckets.set(week, { applied: 0, interviews: 0, log: 0 });
    }
    for (const app of applications.items) {
      if (app.status !== "saved" && inRange(app.appliedDate)) {
        const week = startOfWeekISO(parseISODate(app.appliedDate));
        const bucket = buckets.get(week);
        if (bucket) bucket.applied += 1;
      }
      if (app.interviewDate && inRange(app.interviewDate)) {
        const week = startOfWeekISO(parseISODate(app.interviewDate));
        const bucket = buckets.get(week);
        if (bucket) bucket.interviews += 1;
      }
    }
    for (const entry of engineeringLog.items) {
      if (!inRange(entry.date)) continue;
      const week = startOfWeekISO(parseISODate(entry.date));
      const bucket = buckets.get(week);
      if (bucket) bucket.log += 1;
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, values]) => ({ week: formatShortDay(week), ...values }));
  }, [days, applications.items, engineeringLog.items, inRange]);

  const pipeline = useMemo(() => pipelineStats(applications.items, today), [applications.items, today]);
  const skills = useMemo(() => skillStats(PREP_TOPICS, prep.progress), [prep.progress]);
  const streak = currentStreak(logs, plan.taskIds);

  const rangeTotals = useMemo(() => {
    const activeDays = daily.filter((d) => d.completion > 0).length;
    return {
      applications: sumCounter(logs, "applications", inRange),
      study: sumCounter(logs, "studyHours", inRange),
      focusMinutes: sumCounter(logs, "focusMinutes", inRange),
      focusSessions: focus.sessions.filter((s) => inRange(s.date)).length,
      commits: sumCounter(logs, "commits", inRange),
      logEntries: engineeringLog.items.filter((e) => inRange(e.date)).length,
      activeDays,
      avgCompletion: activeDays === 0 ? 0 : Math.round(daily.reduce((sum, d) => sum + d.completion, 0) / activeDays),
      topicsStudied: Object.values(prep.progress).filter((p) => p.lastStudied && inRange(p.lastStudied)).length,
    };
  }, [daily, logs, focus.sessions, engineeringLog.items, prep.progress, inRange]);

  const logByCategory = useMemo(
    () =>
      LOG_CATEGORIES.map((category) => ({
        category,
        count: engineeringLog.items.filter((e) => e.category === category && inRange(e.date)).length,
      })).filter((row) => row.count > 0),
    [engineeringLog.items, inRange],
  );

  const projectActivity = useMemo(
    () =>
      projects.items
        .map((project) => ({
          project,
          entries: engineeringLog.items.filter((e) => e.projectId === project.id && inRange(e.date)).length,
          openTasks: project.tasks.filter((t) => !t.done).length,
          touched: project.updatedAt >= parseISODate(rangeStart).getTime(),
        }))
        .filter((row) => row.entries > 0 || row.touched)
        .sort((a, b) => b.entries - a.entries),
    [projects.items, engineeringLog.items, rangeStart, inRange],
  );

  if (!hasAnyData) {
    return (
      <div>
        <PageHeader title="Statistics" description="Trends appear as soon as there is something to trend." />
        <EmptyState
          icon="BarChart3"
          title="No data to chart yet"
          description="Log a few days on Today, add applications to the tracker, or load a sample month to see every chart populated."
          action={<Button onClick={loadDemoData}>Load demo data</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Statistics"
        description={`Last ${range} days, ${formatShortDay(rangeStart)} to ${formatShortDay(today)}.`}
        actions={
          <div className="flex rounded-md border border-border p-0.5">
            {([14, 30, 90] as Range[]).map((value) => (
              <Button key={value} variant={range === value ? "secondary" : "ghost"} size="xs" onClick={() => setRange(value)}>
                {value}d
              </Button>
            ))}
          </div>
        }
      />

      {/* ---- Career ---- */}
      <SectionHeading title="Career" />
      <StatStrip className="mb-3">
        <Stat label="Applications logged" value={rangeTotals.applications} detail={`${pipeline.sent} tracked individually`} />
        <Stat label="Response rate" value={`${pipeline.responseRate}%`} detail="all tracked applications" />
        <Stat label="Interview rate" value={`${pipeline.interviewRate}%`} detail={`${pipeline.interviewed} interviews`} accent={SERIES.amber} />
        <Stat label="Offer rate" value={`${pipeline.offerRate}%`} detail={`${pipeline.offers} offer${pipeline.offers === 1 ? "" : "s"}`} accent="#0ca30c" />
        <Stat label="Active" value={pipeline.active} detail="in the pipeline now" />
      </StatStrip>
      <div className="mb-6 grid gap-3 lg:grid-cols-3">
        <ChartCard title="Applications sent" subtitle="per day, from your daily log">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={margin}>
              <defs>
                <linearGradient id="fill-apps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES.blue} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={SERIES.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
              <YAxis {...axisProps} allowDecimals={false} width={32} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} sent`} />} cursor={{ stroke: GRID_STROKE }} />
              <Area type="monotone" dataKey="applications" stroke={SERIES.blue} strokeWidth={2} fill="url(#fill-apps)" dot={false} activeDot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Interviews & applications" subtitle="per week, from the tracker">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={margin} barCategoryGap="30%">
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="week" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} width={32} />
              <Tooltip
                content={<ChartTooltip formatter={(v, key) => `${v} ${key === "applied" ? "applied" : "interviews"}`} />}
                cursor={{ fill: "rgba(137,135,129,0.08)" }}
              />
              <Bar dataKey="applied" fill={SERIES.blue} radius={[3, 3, 0, 0]} />
              <Bar dataKey="interviews" fill={SERIES.amber} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Conversion</CardTitle>
            <p className="text-xs text-muted-foreground">every tracked application</p>
          </CardHeader>
          <CardContent className="pt-2">
            <Funnel stats={pipeline} />
          </CardContent>
        </Card>
      </div>

      {/* ---- Engineering ---- */}
      <SectionHeading title="Engineering" />
      <StatStrip className="mb-3">
        <Stat label="Log entries" value={rangeTotals.logEntries} detail={`${engineeringLog.items.length} all time`} />
        <Stat label="Commits logged" value={rangeTotals.commits} />
        <Stat label="Projects active" value={projectActivity.length} detail={`${projects.items.length} total`} />
        <Stat label="With impact noted" value={engineeringLog.items.filter((e) => e.impact && inRange(e.date)).length} detail="interview-ready" />
      </StatStrip>
      <div className="mb-6 grid gap-3 lg:grid-cols-3">
        <ChartCard title="Engineering log" subtitle="entries per week">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={margin} barCategoryGap="35%">
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="week" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} width={32} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} entries`} />} cursor={{ fill: "rgba(137,135,129,0.08)" }} />
              <Bar dataKey="log" fill={SERIES.violet} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>By category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-1">
            {logByCategory.length === 0 && <p className="text-xs text-muted-foreground">No entries in this range.</p>}
            {logByCategory.map((row) => {
              const max = Math.max(1, ...logByCategory.map((r) => r.count));
              const meta = LOG_CATEGORY_META[row.category];
              return (
                <div key={row.category} className="grid grid-cols-[84px,1fr,auto] items-center gap-2 text-xs">
                  <span className="truncate">{meta.label}</span>
                  <div className="h-2 overflow-hidden rounded bg-secondary">
                    <div className="h-full rounded" style={{ width: `${(row.count / max) * 100}%`, backgroundColor: meta.accent }} />
                  </div>
                  <span className="tabular w-5 text-right font-medium">{row.count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Project activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-1">
            {projectActivity.length === 0 && <p className="text-xs text-muted-foreground">No project activity in this range.</p>}
            {projectActivity.map((row) => (
              <div key={row.project.id} className="flex items-center justify-between text-xs">
                <span className="truncate font-medium">{row.project.name}</span>
                <span className="tabular text-muted-foreground">
                  {row.entries} log · {row.openTasks} open
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ---- Learning ---- */}
      <SectionHeading title="Learning" />
      <StatStrip className="mb-3">
        <Stat label="Study hours" value={rangeTotals.study} detail={`${Math.round((rangeTotals.study / range) * 10) / 10}h per day`} />
        <Stat label="Topics studied" value={rangeTotals.topicsStudied} detail={`${skills.rated} of ${skills.total} rated`} />
        <Stat label="Readiness" value={`${skills.readiness}%`} detail={`${skills.weak.length} weak, ${skills.strong.length} strong`} />
        <Stat label="Problems solved" value={sumCounter(logs, "dsa", inRange)} />
      </StatStrip>
      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <ChartCard title="Study hours" subtitle="per day">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={margin} barCategoryGap="30%">
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
              <YAxis {...axisProps} width={32} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}h`} />} cursor={{ fill: "rgba(137,135,129,0.08)" }} />
              <Bar dataKey="study" fill={SERIES.green} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Problems solved" subtitle="per day">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily} margin={margin}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
              <YAxis {...axisProps} allowDecimals={false} width={32} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} solved`} />} cursor={{ stroke: GRID_STROKE }} />
              <Line type="monotone" dataKey="dsa" stroke={SERIES.violet} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ---- Productivity ---- */}
      <SectionHeading title="Productivity" />
      <StatStrip className="mb-3">
        <Stat label="Current streak" value={streak} detail="days at 50%+ of plan" accent={streak > 0 ? SERIES.orange : undefined} />
        <Stat label="Active days" value={`${rangeTotals.activeDays}/${range}`} detail="with anything ticked" />
        <Stat label="Avg completion" value={`${rangeTotals.avgCompletion}%`} detail="on active days" />
        <Stat label="Focus" value={`${Math.round(rangeTotals.focusMinutes / 60)}h`} detail={`${rangeTotals.focusSessions} sessions`} />
      </StatStrip>
      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Daily completion" subtitle="% of the day plan ticked">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={margin}>
              <defs>
                <linearGradient id="fill-completion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES.orange} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={SERIES.orange} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
              <YAxis {...axisProps} domain={[0, 100]} width={32} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} cursor={{ stroke: GRID_STROKE }} />
              <Area type="monotone" dataKey="completion" stroke={SERIES.orange} strokeWidth={2} fill="url(#fill-completion)" dot={false} activeDot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Focus minutes" subtitle="per day, from completed sprints">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={margin} barCategoryGap="30%">
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
              <YAxis {...axisProps} width={32} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} min`} />} cursor={{ fill: "rgba(137,135,129,0.08)" }} />
              <Bar dataKey="focus" fill={SERIES.blue} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

