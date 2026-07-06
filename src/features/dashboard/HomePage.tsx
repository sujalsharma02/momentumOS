import { motion } from "framer-motion";
import { Flame, Quote, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { useNow } from "@/hooks/useNow";
import { QUOTES } from "@/data/quotes";
import { DAILY_GOALS } from "@/data/goals";
import { dayOfYear, formatLongDate, todayISO } from "@/lib/dates";
import { currentStreak, dailyGoalsMet, dayCompletion } from "@/lib/stats";
import { DreamMeter } from "@/features/dashboard/DreamMeter";
import { MiniCalendar } from "@/features/dashboard/MiniCalendar";
import { MusicCard } from "@/features/dashboard/MusicCard";
import { QuickStatCard } from "@/features/dashboard/QuickStatCard";

export function HomePage() {
  const now = useNow();
  const { logs, hasAnyData, loadDemoData } = useData();
  const today = todayISO();

  const completion = dayCompletion(logs, today);
  const streak = currentStreak(logs);
  const goalsMet = dailyGoalsMet(logs, today);
  const quote = QUOTES[dayOfYear(now) % QUOTES.length];

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Hero: greeting, date, live clock, daily quote */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass relative overflow-hidden rounded-2xl p-6 sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl"
        />
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{formatLongDate(now)}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {greeting}. <span className="text-gradient">Ship the day.</span>
            </h1>
            <div className="mt-4 flex max-w-xl items-start gap-2 text-sm text-muted-foreground">
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                “{quote.text}” <span className="text-foreground/70">— {quote.author}</span>
              </p>
            </div>
          </div>
          <div className="tabular shrink-0 text-left md:text-right">
            <div className="text-5xl font-bold tracking-tight sm:text-6xl">
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
              <span className="animate-pulse-glow text-primary">:</span>
              <span className="text-2xl text-muted-foreground sm:text-3xl">
                {String(now.getSeconds()).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">local time</div>
          </div>
        </div>
        {!hasAnyData && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/[0.06] px-4 py-3 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Fresh start! Explore with sample data, or begin logging your day.</span>
            <Button size="sm" variant="outline" onClick={loadDemoData}>
              Load demo data
            </Button>
          </div>
        )}
      </motion.section>

      {/* Progress ring + streak + dream meter */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-4 p-6">
          <ProgressRing value={completion} label="Today" sublabel={`${goalsMet}/${DAILY_GOALS.length} goals met`} />
          <Button asChild variant="outline" size="sm">
            <Link to="/timetable">Open timetable</Link>
          </Button>
        </Card>

        <Card className="flex flex-col justify-center p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/15">
              <Flame className="h-8 w-8 text-orange-400" />
            </div>
            <div>
              <div className="tabular text-4xl font-bold">{streak}</div>
              <div className="text-sm text-muted-foreground">day streak</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {streak === 0
              ? "Check off at least half of today's timetable to light the fire."
              : streak < 7
                ? "Momentum is building. Don't break the chain."
                : "You're in rare territory. Most people quit long before this."}
          </p>
          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{
                  backgroundColor: i < Math.min(streak, 7) ? "#fb923c" : "hsl(var(--secondary))",
                }}
              />
            ))}
          </div>
        </Card>

        <DreamMeter />
      </div>

      {/* Today's quick counters */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Log today's reps
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <QuickStatCard label="Applications sent" icon="Send" accent="#8b5cf6" counter="applications" target={20} />
          <QuickStatCard label="DSA solved" icon="Binary" accent="#a78bfa" counter="dsa" target={2} />
          <QuickStatCard label="Hours studied" icon="BookOpen" accent="#22d3ee" counter="studyHours" target={2} step={0.5} unit="h" />
          <QuickStatCard label="Recruiters messaged" icon="Handshake" accent="#34d399" counter="recruiters" target={3} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <MiniCalendar />
        <MusicCard />
        <Card className="p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Today's mission brief
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            {DAILY_GOALS.map((goal) => (
              <li key={goal.id} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">{goal.label}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link to="/goals">Track goals</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
