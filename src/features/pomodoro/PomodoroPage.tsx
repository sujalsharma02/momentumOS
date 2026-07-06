import { motion } from "framer-motion";
import { Coffee, Pause, Play, RotateCcw, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useData } from "@/context/DataContext";
import { playComplete } from "@/lib/sound";
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
];

type Phase = "work" | "rest";

export function PomodoroPage() {
  const { adjustCounter } = useData();
  const [presetId, setPresetId] = useState("classic");
  const [customWork, setCustomWork] = useState(45);
  const [customRest, setCustomRest] = useState(15);
  const [phase, setPhase] = useState<Phase>("work");
  const [running, setRunning] = useState(false);
  const [sessionsDone, setSessionsDone] = useState(0);

  const durations =
    presetId === "custom"
      ? { work: customWork, rest: customRest }
      : PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[0];

  const totalSeconds = (phase === "work" ? durations.work : durations.rest) * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef<number | null>(null);

  const resetTo = useCallback(
    (nextPhase: Phase, autoStart = false) => {
      const mins = nextPhase === "work" ? durations.work : durations.rest;
      setPhase(nextPhase);
      setSecondsLeft(mins * 60);
      setRunning(autoStart);
    },
    [durations.work, durations.rest],
  );

  // Reset the clock whenever the preset/custom durations change.
  useEffect(() => {
    setRunning(false);
    setPhase("work");
    setSecondsLeft(durations.work * 60);
  }, [durations.work, durations.rest]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  // Phase completion
  useEffect(() => {
    if (secondsLeft > 0) return;
    playComplete();
    if (phase === "work") {
      setSessionsDone((count) => count + 1);
      resetTo("rest", true);
    } else {
      resetTo("work", false);
    }
  }, [secondsLeft, phase, resetTo]);

  // Keep the tab title informative while the timer runs.
  useEffect(() => {
    if (running) {
      const minutes = Math.floor(secondsLeft / 60);
      const seconds = secondsLeft % 60;
      document.title = `${minutes}:${String(seconds).padStart(2, "0")} · ${phase === "work" ? "Focus" : "Break"} — Momentum OS`;
    } else {
      document.title = "Momentum OS";
    }
    return () => {
      document.title = "Momentum OS";
    };
  }, [running, secondsLeft, phase]);

  const minutes = Math.floor(Math.max(0, secondsLeft) / 60);
  const seconds = Math.max(0, secondsLeft) % 60;
  const progress = totalSeconds === 0 ? 0 : 1 - secondsLeft / totalSeconds;

  const size = 260;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div>
      <PageHeader
        title="Pomodoro"
        description="Deep work in focused sprints. The timer keeps running through breaks automatically."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
        <Card className="flex flex-col items-center justify-center gap-6 p-4 py-8 sm:p-8">
          <Badge variant={phase === "work" ? "default" : "info"} className="px-3 py-1 text-sm">
            {phase === "work" ? (
              <>
                <Zap className="h-3.5 w-3.5" /> Focus
              </>
            ) : (
              <>
                <Coffee className="h-3.5 w-3.5" /> Break
              </>
            )}
          </Badge>

          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                className="stroke-secondary"
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={phase === "work" ? "#8b5cf6" : "#22d3ee"}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: circumference * (1 - progress) }}
                transition={{ duration: 0.5, ease: "linear" }}
                style={{
                  filter: `drop-shadow(0 0 8px ${phase === "work" ? "rgba(139,92,246,0.5)" : "rgba(34,211,238,0.5)"})`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="tabular text-6xl font-bold tracking-tight">
                {minutes}:{String(seconds).padStart(2, "0")}
              </span>
              <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {phase === "work" ? `${durations.work} min sprint` : `${durations.rest} min recharge`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
          </div>

          {sessionsDone > 0 && (
            <p className="text-sm text-muted-foreground">
              🍅 {sessionsDone} session{sessionsDone === 1 ? "" : "s"} completed —{" "}
              <button
                type="button"
                className="text-primary underline-offset-2 hover:underline"
                onClick={() => {
                  adjustCounter("studyHours", Math.round((durations.work / 60) * 2) / 2);
                  setSessionsDone(0);
                }}
              >
                log as study hours
              </button>
            </p>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-2 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Mode
              </h3>
              {[...PRESETS, { id: "custom", label: "Custom", work: customWork, rest: customRest }].map(
                (preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPresetId(preset.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                      presetId === preset.id
                        ? "border-primary/40 bg-primary/10"
                        : "border-transparent hover:bg-white/[0.04]",
                    )}
                  >
                    <span>{preset.label}</span>
                    <span className="tabular text-xs text-muted-foreground">
                      {preset.work}m focus · {preset.rest}m break
                    </span>
                  </button>
                ),
              )}
              {presetId === "custom" && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                    Focus (min)
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={customWork}
                      onChange={(e) => setCustomWork(clamp(Number(e.target.value) || 1, 1, 180))}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                    Break (min)
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={customRest}
                      onChange={(e) => setCustomRest(clamp(Number(e.target.value) || 1, 1, 60))}
                    />
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-sm leading-relaxed text-muted-foreground">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider">Protocol</h3>
              <ul className="space-y-1.5">
                <li>• One task per sprint. Write it down first.</li>
                <li>• Phone in another room. Tabs closed.</li>
                <li>• Breaks are for standing up, not scrolling.</li>
                <li>• After 4 sprints, take a longer walk.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
