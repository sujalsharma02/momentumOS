import { useMemo, useState } from "react";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { PageHeader } from "@/components/shared/PageHeader";
import { Stat, StatStrip } from "@/components/shared/Stat";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/context/DataContext";
import { DOMAIN_META, PREP_TOPICS } from "@/data/prepTopics";
import { formatShortDay } from "@/lib/dates";
import { skillStats } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { PREP_DOMAINS, type PrepDomain, type PrepTopic } from "@/types";
import { STRENGTH_META, TopicDialog } from "@/features/prep/TopicDialog";

type Filter = "all" | PrepDomain | "weak" | "stale";

export function PrepPage() {
  const { prep, loadDemoData, hasAnyData } = useData();
  const [active, setActive] = useState<PrepTopic | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => skillStats(PREP_TOPICS, prep.progress), [prep.progress]);

  const staleCutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  }, []);

  const domainsToShow = PREP_DOMAINS.filter((domain) => {
    if (filter === "all" || filter === "weak" || filter === "stale") return true;
    return filter === domain;
  });

  const topicMatches = (topic: PrepTopic) => {
    const state = prep.getProgress(topic.id);
    if (filter === "weak") return state.strength === "weak";
    if (filter === "stale") return !state.lastStudied || state.lastStudied < staleCutoff;
    return true;
  };

  return (
    <div>
      <PageHeader
        title="Interview Prep"
        description="Readiness by topic. Rate honestly, study the weak ones, collect the questions you actually get asked."
        actions={
          !hasAnyData && stats.rated === 0 ? (
            <Button variant="outline" size="sm" onClick={loadDemoData}>
              Load demo data
            </Button>
          ) : undefined
        }
      />

      <StatStrip className="mb-4">
        <Stat label="Overall readiness" value={`${stats.readiness}%`} detail={`${stats.rated} of ${stats.total} topics rated`} />
        <Stat label="Strong" value={stats.strong.length} accent={STRENGTH_META.strong.accent} />
        <Stat label="Weak" value={stats.weak.length} accent={stats.weak.length ? STRENGTH_META.weak.accent : undefined} detail="study these first" />
        <Stat
          label="Last studied"
          value={stats.recentlyStudied[0] ? formatShortDay(stats.recentlyStudied[0].lastStudied) : "—"}
          detail={stats.recentlyStudied[0]?.topic.title}
        />
        <Stat
          label="Questions banked"
          value={Object.values(prep.progress).reduce((n, p) => n + p.questions.length, 0)}
          detail={`${Object.values(prep.progress).reduce((n, p) => n + p.questions.filter((q) => q.answered).length, 0)} answered`}
        />
      </StatStrip>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ["all", "All"],
            ...PREP_DOMAINS.map((d) => [d, DOMAIN_META[d].label] as [Filter, string]),
            ["weak", "Weak only"],
            ["stale", "Not studied in 2 weeks"],
          ] as Array<[Filter, string]>
        ).map(([key, label]) => (
          <Button key={key} variant={filter === key ? "secondary" : "ghost"} size="xs" onClick={() => setFilter(key)}>
            {label}
          </Button>
        ))}
      </div>

      <div className="space-y-6">
        {domainsToShow.map((domain) => {
          const meta = DOMAIN_META[domain];
          const topics = PREP_TOPICS.filter((topic) => topic.domain === domain && topicMatches(topic));
          if (topics.length === 0) return null;
          const domainReadiness = Math.round(
            PREP_TOPICS.filter((t) => t.domain === domain).reduce((sum, t) => sum + prep.getProgress(t.id).readiness, 0) /
              PREP_TOPICS.filter((t) => t.domain === domain).length,
          );

          return (
            <section key={domain}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${meta.accent}1f`, color: meta.accent }}
                  >
                    <DynamicIcon name={meta.icon} className="h-3.5 w-3.5" />
                  </span>
                  {meta.label}
                  <span className="text-xs font-normal text-muted-foreground">{meta.description}</span>
                </h2>
                <span className="tabular text-xs text-muted-foreground">{domainReadiness}% avg</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {topics.map((topic) => {
                  const state = prep.getProgress(topic.id);
                  const strength = STRENGTH_META[state.strength];
                  const stale = Boolean(state.lastStudied) && (state.lastStudied as string) < staleCutoff;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setActive(topic)}
                      className="surface surface-interactive p-3.5 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <DynamicIcon name={topic.icon} className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <h3 className="truncate text-sm font-medium">{topic.title}</h3>
                        </div>
                        <span
                          className={cn("shrink-0 text-[10px] font-semibold uppercase tracking-wider")}
                          style={{ color: strength.accent }}
                        >
                          {state.strength === "unrated" ? "" : strength.label}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{topic.description}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Progress value={state.readiness} className="h-1 flex-1" color={meta.accent} />
                        <span className="tabular w-8 text-right text-[11px] text-muted-foreground">{state.readiness}%</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {state.lastStudied ? formatShortDay(state.lastStudied) : "not studied"}
                          {stale && <span className="ml-1 text-amber-600 dark:text-amber-400">· stale</span>}
                        </span>
                        <span className="tabular">
                          {state.questions.length > 0 && `${state.questions.filter((q) => q.answered).length}/${state.questions.length} q`}
                          {state.notes.trim() && (state.questions.length > 0 ? " · notes" : "notes")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        {domainsToShow.every((d) => PREP_TOPICS.filter((t) => t.domain === d && topicMatches(t)).length === 0) && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {filter === "weak" ? "No topics marked weak. Rate a few honestly first." : "Everything has been studied recently."}
          </p>
        )}
      </div>

      <TopicDialog topic={active} onClose={() => setActive(null)} />
    </div>
  );
}
