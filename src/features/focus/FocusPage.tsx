import { Coffee, Pause, Play, RotateCcw, SkipForward, Trash2, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Stat, StatStrip } from "@/components/shared/Stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useData } from "@/context/DataContext";
import { isSameISOWeek, todayISO } from "@/lib/dates";
import { playComplete } from "@/lib/sound";
import { focusMinutes } from "@/lib/stats";
import { clamp, cn } from "@/lib/utils";

interface Preset {
  id: string;
  label: string;
  work: number;
  rest: number;
}

const PRESETS: Preset[] = [
  { id: "classic", label: "25 / 5", work: 25, rest: 5 },
  { id: "deep", label: "50 / 10", work: 50, rest: 10 },
  { id: "long", label: "90 / 20", work: 90, rest: 20 },
];

type Phase = "work" | "rest";

export function FocusPage() {
  const { focus, dayLogs } = useData();
  const today = todayISO();

  const [presetId, setPresetId] = useState("classic");
  const [customWork, setCustomWork] = useState(45);
  const [customRest, setCustomRest] = useState(15);
  const [phase, setPhase] = useState<Phase>("work");
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState("");

  const durations = useMemo(
    () =>
      presetId === "custom"
        ? { work: customWork, rest: customRest }
        : (PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[0]),
    [presetId, customWork, customRest],
  );

  const totalSeconds = (phase === "work" ? durations.work : durations.rest) * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  // Latest values for the interval callback, without re-creating the interval.
  const stateRef = useRef({ phase, durations, label });
  stateRef.current = { phase, durations, label };

  const resetTo = useCallback((nextPhase: Phase, autoStart = false) => {
    const mins = nextPhase === "work" ? stateRef.current.durations.work : stateRef.current.durations.rest;
    setPhase(nextPhase);
    setSecondsLeft(mins * 60);
    setRunning(autoStart);
  }, []);

  // Changing the preset resets the clock to a fresh work sprint.
  useEffect(() => {
    setRunning(false);
    setPhase("work");
    setSecondsLeft(durations.work * 60);
  }, [durations.work, durations.rest]);

  const completePhase = useCallback(() => {
    playComplete();
    const { phase: current, durations: d, label: currentLabel } = stateRef.current;
    if (current === "work") {
      focus.logSession(d.work, currentLabel);
      dayLogs.adjustCounter("focusSessions", 1);
      dayLogs.adjustCounter("focusMinutes", d.work);
      resetTo("rest", true);
    } else {
      resetTo("work", false);
    }
  }, [focus, dayLogs, resetTo]);

  // The tick stops itself at zero so the count can never go negative.
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          // Defer so the state update above settles before the phase change.
          window.setTimeout(completePhase, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, completePhase]);

  // Tab title shows the countdown while running.
  useEffect(() => {
    if (running) {
      const minutes = Math.floor(secondsLeft / 60);
      const seconds = secondsLeft % 60;
      document.title = `${minutes}:${String(seconds).padStart(2, "0")} ${phase === "work" ? "Focus" : "Break"} · Momentum OS`;
    } else {
      document.title = "Momentum OS";
    }
    return () => {
      document.title = "Momentum OS";
    };
  }, [running, secondsLeft, phase]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = totalSeconds === 0 ? 0 : 1 - secondsLeft / totalSeconds;

  const todaySessions = focus.sessions.filter((session) => session.date === today);
  const todayMinutes = focusMinutes(focus.sessions, (date) => date === today);
  const weekMinutes = focusMinutes(focus.sessions, (date) => isSameISOWeek(date));

  const size = 232;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div>
      <PageHeader
        title="Focus"
        description="Timed sprints. Completed sessions are recorded and count toward your goals and statistics."
      />

      <StatStrip className="mb-4">
        <Stat label="Today" value={todaySessions.length} detail={`${todayMinutes} min focused`} />
        <Stat label="This week" value={`${Math.round(weekMinutes / 60 * 10) / 10}h`} detail={`${focus.sessions.filter((s) => isSameISOWeek(s.date)).length} sessions`} />
        <Stat label="All time" value={focus.sessions.length} detail={`${Math.round(focusMinutes(focus.sessions, () => true) / 60)}h total`} />
      </StatStrip>

      <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
        <Card className="flex flex-col items-center justify-center gap-5 p-6 py-8">
          <Badge variant={phase === "work" ? "default" : "info"}>
            {phase === "work" ? (
              <>
                <Zap className="h-3 w-3" /> Focus
              </>
            ) : (
              <>
                <Coffee className="h-3 w-3" /> Break
              </>
            )}
          </Badge>

          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-secondary" />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={phase === "work" ? "hsl(var(--primary))" : "#3987e5"}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="tabular text-5xl font-semibold tracking-tight">
                {minutes}:{String(seconds).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                {phase === "work" ? `${durations.work} min sprint` : `${durations.rest} min break`}
              </span>
            </div>
          </div>

          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="What are you working on?"
            className="max-w-xs text-center"
            disabled={phase === "rest"}
          />

          <div className="flex items-center gap-2">
            <Button size="lg" onClick={() => setRunning((r) => !r)} className="w-32">
              {running ? (
                <>
                  <Pause /> Pause
                </>
              ) : (
                <>
                  <Play /> Start
                </>
              )}
            </Button>
            <Button variant="outline" size="lg" onClick={() => resetTo(phase)} aria-label="Reset timer">
              <RotateCcw />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => resetTo(phase === "work" ? "rest" : "work", false)}
              aria-label={phase === "work" ? "Skip to break" : "Skip break"}
              title={phase === "work" ? "Skip to break (does not log a session)" : "Skip break"}
            >
              <SkipForward />
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[...PRESETS, { id: "custom", label: "Custom", work: customWork, rest: customRest }].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPresetId(preset.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
                    presetId === preset.id ? "border-primary/40 bg-accent" : "border-transparent hover:bg-elevated",
                  )}
                >
                  <span className="font-medium">{preset.label}</span>
                  <span className="tabular text-xs text-muted-foreground">
                    {preset.work}m · {preset.rest}m
                  </span>
                </button>
              ))}
              {presetId === "custom" && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    Focus (min)
                    <Input type="number" min={1} max={180} value={customWork} onChange={(e) => setCustomWork(clamp(Number(e.target.value) || 1, 1, 180))} />
                  </label>
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    Break (min)
                    <Input type="number" min={1} max={60} value={customRest} onChange={(e) => setCustomRest(clamp(Number(e.target.value) || 1, 1, 60))} />
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Today's sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {todaySessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing yet. A completed sprint lands here automatically.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {todaySessions.map((session) => (
                    <li key={session.id} className="group flex items-center gap-2 py-1.5 text-sm">
                      <span className="tabular w-10 shrink-0 text-xs text-muted-foreground">
                        {new Date(session.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{session.label ?? "Focus"}</span>
                      <span className="tabular text-xs text-muted-foreground">{session.minutes}m</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6 opacity-0 hover:text-destructive group-hover:opacity-100"
                        onClick={() => {
                          focus.removeSession(session.id);
                          dayLogs.adjustCounter("focusSessions", -1, session.date);
                          dayLogs.adjustCounter("focusMinutes", -session.minutes, session.date);
                        }}
                        aria-label="Remove session"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {todayMinutes > 0 && (
                <button
                  type="button"
                  className="mt-3 text-xs text-primary underline-offset-2 hover:underline"
                  onClick={() => dayLogs.adjustCounter("studyHours", Math.round((todayMinutes / 60) * 2) / 2)}
                >
                  Add {Math.round((todayMinutes / 60) * 2) / 2}h to today's study hours
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
