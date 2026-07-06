import { useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { formatShortDay, lastNDays } from "@/lib/dates";
import { counterValue, sumCounter } from "@/lib/stats";
import { AXIS_TICK, ChartCard, ChartTooltip, GRID_STROKE } from "@/features/stats/ChartCard";

/* Series colors: validated dark-surface categorical slots (blue, aqua, violet).
   Status colors are the reserved status palette, never reused for series. */
const SERIES = { applications: "#3987e5", hours: "#199e70", dsa: "#9085e9" };
const STATUS = { applied: "#3987e5", interview: "#c98500", offer: "#0ca30c", rejected: "#e66767" };

export function StatsPage() {
  const { logs, applications, hasAnyData, loadDemoData } = useData();

  const series = useMemo(
    () =>
      lastNDays(14).map((date) => ({
        day: formatShortDay(date),
        applications: counterValue(logs, date, "applications"),
        hours: counterValue(logs, date, "studyHours"),
        dsa: counterValue(logs, date, "dsa"),
      })),
    [logs],
  );

  const totals = useMemo(
    () => ({
      applications: sumCounter(logs, "applications"),
      interviews: applications.filter((a) => a.status === "interview").length,
      offers: applications.filter((a) => a.status === "offer").length,
      hours: sumCounter(logs, "studyHours"),
      dsa: sumCounter(logs, "dsa"),
      commits: sumCounter(logs, "commits"),
    }),
    [logs, applications],
  );

  const statusBreakdown = useMemo(() => {
    const counts: Record<keyof typeof STATUS, number> = { applied: 0, interview: 0, offer: 0, rejected: 0 };
    for (const app of applications) counts[app.status] += 1;
    const max = Math.max(1, ...Object.values(counts));
    return (Object.keys(counts) as Array<keyof typeof STATUS>).map((status) => ({
      status,
      count: counts[status],
      pct: (counts[status] / max) * 100,
    }));
  }, [applications]);

  if (!hasAnyData) {
    return (
      <div>
        <PageHeader title="Stats" description="Charts appear as soon as you start logging." />
        <EmptyState
          icon="BarChart3"
          title="No data yet"
          description="Log a few days on the dashboard and timetable, or load demo data to preview the charts."
          action={<Button onClick={loadDemoData}>Load demo data</Button>}
        />
      </div>
    );
  }

  const tiles = [
    { label: "Applications", value: totals.applications, accent: SERIES.applications },
    { label: "Interviews", value: totals.interviews, accent: STATUS.interview },
    { label: "Offers", value: totals.offers, accent: STATUS.offer },
    { label: "Study hours", value: totals.hours, accent: SERIES.hours },
    { label: "DSA solved", value: totals.dsa, accent: SERIES.dsa },
    { label: "Commits", value: totals.commits, accent: "#d95926" },
  ];

  return (
    <div>
      <PageHeader title="Stats" description="The scoreboard of the grind — last 14 days plus all-time totals." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile) => (
          <Card key={tile.label} className="glass-hover">
            <CardContent className="p-4">
              <div className="tabular text-2xl font-bold" style={{ color: tile.accent }}>
                {tile.value}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{tile.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Applications sent" subtitle="per day, last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fill-apps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES.applications} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={SERIES.applications} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} applications`} />} cursor={{ stroke: GRID_STROKE }} />
              <Area
                type="monotone"
                dataKey="applications"
                stroke={SERIES.applications}
                strokeWidth={2}
                fill="url(#fill-apps)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Study hours" subtitle="AI learning per day, last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}h studied`} />} cursor={{ fill: "rgba(137,135,129,0.08)" }} />
              <Bar dataKey="hours" fill={SERIES.hours} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="DSA questions solved" subtitle="per day, last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} solved`} />} cursor={{ stroke: GRID_STROKE }} />
              <Line
                type="monotone"
                dataKey="dsa"
                stroke={SERIES.dsa}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Application funnel" subtitle="status of every tracked application">
          <div className="flex h-full flex-col justify-center gap-4">
            {statusBreakdown.map((row) => (
              <div key={row.status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium capitalize">{row.status}</span>
                  <span className="tabular text-muted-foreground">{row.count}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${row.pct}%`, backgroundColor: STATUS[row.status] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
