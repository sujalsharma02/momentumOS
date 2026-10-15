import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock3, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { PREP_TOPICS } from "@/data/prepTopics";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { PrepTopic } from "@/types";

interface RoadmapWeek {
  id: string;
  title: string;
  deliverable: string;
  done: boolean;
}

interface SkillRoadmap {
  weeks: RoadmapWeek[];
  updatedAt: number;
}

interface StudyTimerState {
  topicId: string;
  accumulatedSeconds: number;
  startedAt: number | null;
  running: boolean;
}

const EMPTY_TIMER: StudyTimerState = {
  topicId: "",
  accumulatedSeconds: 0,
  startedAt: null,
  running: false,
};

const DEFAULT_WEEKS: Array<Pick<RoadmapWeek, "title" | "deliverable">> = [
  { title: "Understand the fundamentals", deliverable: "Write down the core concepts and explain them in your own words." },
  { title: "Study the architecture", deliverable: "Draw the main components and explain how data flows between them." },
  { title: "Build a small prototype", deliverable: "Create a minimal working example that demonstrates the core concept." },
  { title: "Build the main feature", deliverable: "Implement a useful end-to-end feature without following a tutorial line by line." },
  { title: "Test and evaluate", deliverable: "Add repeatable tests and define what a successful result looks like." },
  { title: "Handle edge cases", deliverable: "Test failures, invalid inputs, limits and recovery paths." },
  { title: "Polish and document", deliverable: "Improve the code, document design decisions and add a clear README." },
  { title: "Ship and demonstrate", deliverable: "Publish the project or demo and write a short engineering retrospective." },
];

function makeRoadmap(topic: PrepTopic): SkillRoadmap {
  return {
    weeks: DEFAULT_WEEKS.map((week, index) => ({
      id: `${topic.id}-week-${index + 1}`,
      title: week.title,
      deliverable: week.deliverable,
      done: false,
    })),
    updatedAt: Date.now(),
  };
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":");
}

export function BuildPlan() {
  const { prep, focus, dayLogs } = useData();
  const [selectedTopicId, setSelectedTopicId] = useState(PREP_TOPICS[0]?.id ?? "");
  const [roadmaps, setRoadmaps] = useLocalStorage<Record<string, SkillRoadmap>>("skillBuildRoadmaps", {});
  const [timer, setTimer] = useLocalStorage<StudyTimerState>("skillStudyTimer", EMPTY_TIMER);
  const [now, setNow] = useState(Date.now());

  const topic = PREP_TOPICS.find((item) => item.id === selectedTopicId) ?? PREP_TOPICS[0];
  const roadmap = topic ? roadmaps[topic.id] ?? makeRoadmap(topic) : undefined;
  const completedWeeks = roadmap?.weeks.filter((week) => week.done).length ?? 0;
  const elapsedSeconds = timer.accumulatedSeconds + (
    timer.running && timer.startedAt ? Math.max(0, Math.floor((now - timer.startedAt) / 1000)) : 0
  );
  const timerMatchesTopic = Boolean(topic && timer.topicId === topic.id);
  const visibleSeconds = timerMatchesTopic ? elapsedSeconds : 0;
  const topicMinutes = useMemo(
    () => focus.sessions.filter((session) => topic && session.label === `Study: ${topic.title}`).reduce((sum, session) => sum + session.minutes, 0),
    [focus.sessions, topic],
  );

  useEffect(() => {
    if (!timer.running) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timer.running]);

  const saveRoadmap = (next: SkillRoadmap) => {
    if (!topic) return;
    setRoadmaps((previous) => ({ ...previous, [topic.id]: { ...next, updatedAt: Date.now() } }));
  };

  const updateWeek = (weekId: string, patch: Partial<RoadmapWeek>) => {
    if (!roadmap) return;
    saveRoadmap({ ...roadmap, weeks: roadmap.weeks.map((week) => week.id === weekId ? { ...week, ...patch } : week) });
  };

  const startTimer = () => {
    if (!topic) return;
    if (timer.running && timer.topicId === topic.id) return;
    const continuing = timer.topicId === topic.id;
    setTimer({
      topicId: topic.id,
      accumulatedSeconds: continuing ? timer.accumulatedSeconds : 0,
      startedAt: Date.now(),
      running: true,
    });
    prep.markStudied(topic.id);
    setNow(Date.now());
  };

  const pauseTimer = () => {
    if (!timer.running || !timer.startedAt) return;
    setTimer({
      ...timer,
      accumulatedSeconds: timer.accumulatedSeconds + Math.max(0, Math.floor((Date.now() - timer.startedAt) / 1000)),
      startedAt: null,
      running: false,
    });
    setNow(Date.now());
  };

  const stopTimer = () => {
    if (!topic || !timerMatchesTopic) return;
    const seconds = elapsedSeconds;
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      focus.logSession(minutes, `Study: ${topic.title}`);
      dayLogs.adjustCounter("studyHours", minutes / 60);
      dayLogs.adjustCounter("focusMinutes", minutes);
      dayLogs.adjustCounter("focusSessions", 1);
    }
    prep.markStudied(topic.id);
    setTimer(EMPTY_TIMER);
    setNow(Date.now());
  };

  const resetTimer = () => {
    if (timer.running && timer.startedAt) {
      setTimer({ ...timer, accumulatedSeconds: 0, startedAt: Date.now(), running: true });
    } else {
      setTimer(EMPTY_TIMER);
    }
    setNow(Date.now());
  };

  if (!topic || !roadmap) return null;

  return (
    <section className="mb-6 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Build mode</p>
          <h2 className="mt-1 text-lg font-semibold">Turn a skill into a project</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Keep your existing skills. Break each one into weekly deliverables, measure real study time, and finish with something you can demonstrate.
          </p>
        </div>
        <label className="grid min-w-56 gap-1 text-xs text-muted-foreground">
          Skill to upgrade
          <select
            value={topic.id}
            disabled={Boolean(timer.topicId)}
            onChange={(event) => setSelectedTopicId(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {PREP_TOPICS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),300px]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>{topic.title} roadmap</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Eight suggested weeks. Edit the deliverables to fit your schedule and level.</p>
              </div>
              <span className="tabular text-sm text-muted-foreground">{completedWeeks}/8 complete</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${completedWeeks / roadmap.weeks.length * 100}%` }} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {roadmap.weeks.map((week, index) => (
              <div key={week.id} className="rounded-lg border border-border/70 p-3">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => updateWeek(week.id, { done: !week.done })}
                    className="mt-0.5 shrink-0 text-primary"
                    aria-label={week.done ? `Mark week ${index + 1} incomplete` : `Complete week ${index + 1}`}
                  >
                    {week.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Week {index + 1}</p>
                    <input
                      aria-label={`Week ${index + 1} title`}
                      value={week.title}
                      onChange={(event) => updateWeek(week.id, { title: event.target.value })}
                      className={`w-full bg-transparent text-sm font-medium outline-none focus:ring-1 focus:ring-primary ${week.done ? "text-muted-foreground line-through" : ""}`}
                    />
                    <input
                      aria-label={`Week ${index + 1} deliverable`}
                      value={week.deliverable}
                      onChange={(event) => updateWeek(week.id, { deliverable: event.target.value })}
                      className="mt-1 w-full bg-transparent text-xs leading-relaxed text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => saveRoadmap(makeRoadmap(topic))} className="mt-1">
              <RotateCcw className="h-3.5 w-3.5" /> Reset this roadmap
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2"><Timer className="h-4 w-4" /> Study stopwatch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{topic.title}</p>
              <div className="my-4 text-center font-mono text-3xl font-semibold tabular-nums tracking-tight">{formatDuration(visibleSeconds)}</div>
              <div className="flex flex-wrap justify-center gap-2">
                {timer.running && timerMatchesTopic ? (
                  <Button onClick={pauseTimer}><Pause className="h-4 w-4" /> Pause</Button>
                ) : (
                  <Button onClick={startTimer} disabled={Boolean(timer.topicId && timer.topicId !== topic.id)}>
                    <Play className="h-4 w-4" /> {timerMatchesTopic && timer.accumulatedSeconds > 0 ? "Resume" : "Start"}
                  </Button>
                )}
                <Button variant="outline" onClick={resetTimer} disabled={Boolean(timer.topicId && timer.topicId !== topic.id)} aria-label="Reset stopwatch"><RotateCcw className="h-4 w-4" /></Button>
                <Button variant="outline" onClick={stopTimer} disabled={!timerMatchesTopic || elapsedSeconds < 60}>Stop & save</Button>
              </div>
              <div className="mt-4 border-t border-border/70 pt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Saved study time</span>
                  <span className="tabular">{Math.floor(topicMinutes / 60)}h {topicMinutes % 60}m</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Time is saved in this browser and contributes to study statistics when you stop a session of at least one minute.</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium">Finish with evidence</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">For each week, aim to produce code, tests, a demo, a GitHub link, or a short engineering note. Hours alone do not prove mastery.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
