import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Stat, StatStrip } from "@/components/shared/Stat";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useData } from "@/context/DataContext";
import { LOG_CATEGORY_META } from "@/data/pipeline";
import { formatMediumDate, isSameISOWeek, isSameMonth } from "@/lib/dates";
import { LOG_CATEGORIES, type LogCategory, type LogEntry } from "@/types";
import { LogEntryDialog } from "@/features/log/LogEntryDialog";

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function EngineeringLogPage() {
  const { engineeringLog, projects, loadDemoData } = useData();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | LogCategory>("all");
  const [projectId, setProjectId] = useState<"all" | string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LogEntry | null>(null);

  const entries = engineeringLog.items;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (category !== "all" && entry.category !== category) return false;
      if (projectId !== "all" && entry.projectId !== projectId) return false;
      if (!q) return true;
      return [entry.title, entry.description, entry.impact, entry.lessons, ...entry.technologies]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [entries, query, category, projectId]);

  const grouped = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    for (const entry of filtered) {
      const key = monthKey(entry.date);
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return [...map.entries()];
  }, [filtered]);

  const techCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) for (const tech of entry.technologies) counts.set(tech, (counts.get(tech) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [entries]);

  const projectName = (id?: string) => projects.items.find((p) => p.id === id)?.name;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (entry: LogEntry) => {
    setEditing(entry);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Engineering Log"
        description="A dated record of real work: bugs, decisions, incidents, experiments. The examples you will need in interviews."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Log work
          </Button>
        }
      />

      <StatStrip className="mb-4">
        <Stat label="This week" value={entries.filter((e) => isSameISOWeek(e.date)).length} />
        <Stat label="This month" value={entries.filter((e) => isSameMonth(e.date)).length} />
        <Stat label="All time" value={entries.length} />
        <Stat label="With impact noted" value={entries.filter((e) => e.impact).length} detail="the interview-ready ones" />
        <Stat label="Technologies" value={new Set(entries.flatMap((e) => e.technologies)).size} />
      </StatStrip>

      {entries.length === 0 ? (
        <EmptyState
          icon="NotebookPen"
          title="Nothing logged yet"
          description="When you fix something hard, make an architecture call, or handle an incident, write it down here the same day. In six months this is the list you prepare interviews from."
          action={
            <>
              <Button onClick={openCreate}>
                <Plus /> Log work
              </Button>
              <Button variant="outline" onClick={loadDemoData}>
                Load demo data
              </Button>
            </>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr,260px]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search entries" className="pl-8" />
              </div>
              <Select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="sm:w-44" aria-label="Filter by category">
                <option value="all">All categories</option>
                {LOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {LOG_CATEGORY_META[c].label}
                  </option>
                ))}
              </Select>
              {projects.items.length > 0 && (
                <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="sm:w-44" aria-label="Filter by project">
                  <option value="all">All projects</option>
                  {projects.items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {grouped.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Nothing matches these filters.</p>
            )}

            <div className="space-y-6">
              {grouped.map(([month, monthEntries]) => (
                <section key={month}>
                  <h2 className="eyebrow mb-2">
                    {monthLabel(month)}
                    <span className="tabular ml-2 text-muted-foreground/70">{monthEntries.length}</span>
                  </h2>
                  <div className="surface divide-y divide-border/60">
                    {monthEntries.map((entry) => {
                      const meta = LOG_CATEGORY_META[entry.category];
                      const project = projectName(entry.projectId);
                      return (
                        <article key={entry.id} className="group flex gap-3 p-4">
                          <div
                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                            style={{ backgroundColor: `${meta.accent}1f`, color: meta.accent }}
                            title={meta.label}
                          >
                            <DynamicIcon name={meta.icon} className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <h3 className="text-sm font-semibold">{entry.title}</h3>
                              <span className="tabular text-xs text-muted-foreground">{formatMediumDate(entry.date)}</span>
                              <span className="text-xs text-muted-foreground">· {meta.label}</span>
                              {project && <span className="text-xs text-muted-foreground">· {project}</span>}
                            </div>
                            {entry.description && (
                              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
                            )}
                            {(entry.impact || entry.lessons) && (
                              <dl className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2">
                                {entry.impact && (
                                  <div className="surface-muted px-2.5 py-1.5">
                                    <dt className="eyebrow text-[10px]">Impact</dt>
                                    <dd className="mt-0.5">{entry.impact}</dd>
                                  </div>
                                )}
                                {entry.lessons && (
                                  <div className="surface-muted px-2.5 py-1.5">
                                    <dt className="eyebrow text-[10px]">Lesson</dt>
                                    <dd className="mt-0.5">{entry.lessons}</dd>
                                  </div>
                                )}
                              </dl>
                            )}
                            {entry.technologies.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {entry.technologies.map((tech) => (
                                  <span key={tech} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(entry)} aria-label="Edit entry">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="hover:text-destructive"
                              onClick={() =>
                                confirm({
                                  title: "Delete this entry?",
                                  description: entry.title,
                                  onConfirm: () => engineeringLog.remove(entry.id),
                                })
                              }
                              aria-label="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="surface p-4">
              <h3 className="eyebrow mb-2">By category</h3>
              <div className="space-y-1">
                {LOG_CATEGORIES.map((c) => {
                  const count = entries.filter((e) => e.category === c).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(category === c ? "all" : c)}
                      className="flex w-full items-center justify-between rounded px-1.5 py-1 text-xs hover:bg-elevated"
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LOG_CATEGORY_META[c].accent }} />
                        {LOG_CATEGORY_META[c].label}
                      </span>
                      <span className="tabular font-medium">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {techCounts.length > 0 && (
              <div className="surface p-4">
                <h3 className="eyebrow mb-2">Most used</h3>
                <div className="flex flex-wrap gap-1">
                  {techCounts.map(([tech, count]) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => setQuery(tech)}
                      className="rounded bg-secondary px-2 py-0.5 text-xs hover:bg-elevated"
                    >
                      {tech} <span className="tabular text-muted-foreground">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      <LogEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        projects={projects.items}
        onSubmit={(values) => {
          if (editing) engineeringLog.update(editing.id, values);
          else engineeringLog.create(values);
        }}
      />
      {confirmDialog}
    </div>
  );
}
