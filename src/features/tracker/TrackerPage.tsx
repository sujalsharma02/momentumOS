import {
  ArrowUpDown,
  CalendarClock,
  ExternalLink,
  LayoutGrid,
  List,
  Mic,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Stat, StatStrip } from "@/components/shared/Stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useData } from "@/context/DataContext";
import { PIPELINE_ORDER, PRIORITY_META, STATUS_META, WORK_MODE_LABEL } from "@/data/pipeline";
import { formatMediumDate, todayISO } from "@/lib/dates";
import { pipelineStats } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, JobApplication, Priority, WorkMode } from "@/types";
import { ApplicationDialog } from "@/features/tracker/ApplicationDialog";
import { Funnel } from "@/features/tracker/Funnel";

type SortKey = "company" | "status" | "appliedDate" | "priority" | "followUpDate" | "updatedAt";
type View = "table" | "board";

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function compare(a: JobApplication, b: JobApplication, key: SortKey): number {
  switch (key) {
    case "company":
      return a.company.localeCompare(b.company);
    case "status":
      return PIPELINE_ORDER.indexOf(a.status) - PIPELINE_ORDER.indexOf(b.status);
    case "priority":
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    case "appliedDate":
      return a.appliedDate.localeCompare(b.appliedDate);
    case "followUpDate":
      return (a.followUpDate ?? "9999").localeCompare(b.followUpDate ?? "9999");
    case "updatedAt":
      return a.updatedAt - b.updatedAt;
  }
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: PRIORITY_META[priority].accent }}
      title={`${PRIORITY_META[priority].label} priority`}
    />
  );
}

export function TrackerPage() {
  const { applications, loadDemoData } = useData();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const today = todayISO();

  const [view, setView] = useState<View>("table");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | ApplicationStatus>("active");
  const [modeFilter, setModeFilter] = useState<"all" | WorkMode>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);

  const stats = useMemo(() => pipelineStats(applications.items, today), [applications.items, today]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = applications.items.filter((app) => {
      if (q) {
        const haystack = [app.company, app.role, app.location, app.source, app.contact, app.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (statusFilter === "active") {
        if (STATUS_META[app.status].stage === "closed") return false;
      } else if (statusFilter !== "all" && app.status !== statusFilter) {
        return false;
      }
      if (modeFilter !== "all" && app.workMode !== modeFilter) return false;
      if (priorityFilter !== "all" && app.priority !== priorityFilter) return false;
      return true;
    });
    const direction = sortAsc ? 1 : -1;
    return [...rows].sort((a, b) => compare(a, b, sortKey) * direction);
  }, [applications.items, query, statusFilter, modeFilter, priorityFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc((value) => !value);
    } else {
      setSortKey(key);
      setSortAsc(key === "company" || key === "status" || key === "priority");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (app: JobApplication) => {
    setEditing(app);
    setDialogOpen(true);
  };

  const requestDelete = (app: JobApplication) =>
    confirm({
      title: `Delete ${app.company}?`,
      description: `${app.role} and its notes will be removed. This cannot be undone.`,
      onConfirm: () => applications.remove(app.id),
    });

  const boardColumns = PIPELINE_ORDER.filter(
    (status) => statusFilter !== "active" || STATUS_META[status].stage !== "closed",
  );

  return (
    <div>
      <PageHeader
        title="Job Tracker"
        description="Every application, where it stands, and what needs doing next."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add application
          </Button>
        }
      />

      <StatStrip className="mb-4">
        <Stat label="This month" value={stats.appliedThisMonth} detail={`${stats.total} tracked in total`} />
        <Stat label="Active" value={stats.active} detail="awaiting a next step" />
        <Stat label="Interviews" value={stats.interviewed} detail={`${stats.interviewRate}% of sent`} accent="#c98500" />
        <Stat label="Offers" value={stats.offers} detail={`${stats.offerRate}% of interviewed`} accent="#0ca30c" />
        <Stat label="Response rate" value={`${stats.responseRate}%`} detail={`${stats.responded} of ${stats.sent} sent`} />
        <Stat
          label="Follow-ups due"
          value={stats.followUpsDue.length}
          detail={stats.followUpsDue.length ? "nudge them today" : "nothing overdue"}
          accent={stats.followUpsDue.length ? "#d95926" : undefined}
        />
      </StatStrip>

      {(stats.followUpsDue.length > 0 || stats.upcomingInterviews.length > 0) && (
        <div className="mb-4 grid gap-3 lg:grid-cols-2">
          {stats.followUpsDue.length > 0 && (
            <Card className="border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <CalendarClock className="h-4 w-4" /> Follow-ups due
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {stats.followUpsDue.slice(0, 4).map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => openEdit(app)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated"
                  >
                    <span>
                      <span className="font-medium">{app.company}</span>
                      <span className="text-muted-foreground"> · {app.role}</span>
                    </span>
                    <span className="tabular text-xs text-muted-foreground">
                      {app.followUpDate && formatMediumDate(app.followUpDate)}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
          {stats.upcomingInterviews.length > 0 && (
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Mic className="h-4 w-4" /> Upcoming interviews
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {stats.upcomingInterviews.slice(0, 4).map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => openEdit(app)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated"
                  >
                    <span>
                      <span className="font-medium">{app.company}</span>
                      <span className="text-muted-foreground"> · {STATUS_META[app.status].label}</span>
                    </span>
                    <span className="tabular text-xs text-muted-foreground">
                      {app.interviewDate && formatMediumDate(app.interviewDate)}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {applications.items.length === 0 ? (
        <EmptyState
          icon="Briefcase"
          title="No applications tracked yet"
          description="This is your pipeline: every role you apply to, with follow-ups, interview dates and conversion rates. Add the first one, or load a sample month to see it working."
          action={
            <>
              <Button onClick={openCreate}>
                <Plus /> Add application
              </Button>
              <Button variant="outline" onClick={loadDemoData}>
                Load demo data
              </Button>
            </>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr,280px]">
          <div className="min-w-0">
            {/* Controls */}
            <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search company, role, location, notes"
                  className="pl-8"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 lg:flex">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  aria-label="Filter by status"
                  className="lg:w-40"
                >
                  <option value="active">Active only</option>
                  <option value="all">All statuses</option>
                  {PIPELINE_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_META[status].label} ({stats.byStatus[status]})
                    </option>
                  ))}
                </Select>
                <Select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value as typeof modeFilter)}
                  aria-label="Filter by work mode"
                  className="lg:w-32"
                >
                  <option value="all">Any mode</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </Select>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
                  aria-label="Filter by priority"
                  className="lg:w-32"
                >
                  <option value="all">Any priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </div>
              <div className="flex rounded-md border border-border p-0.5">
                <Button
                  variant={view === "table" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => setView("table")}
                  aria-label="Table view"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={view === "board" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => setView("board")}
                  aria-label="Board view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {view === "table" ? (
              <div className="surface overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        {(
                          [
                            ["company", "Company / role"],
                            ["status", "Status"],
                            ["priority", "Pri."],
                            ["appliedDate", "Applied"],
                            ["followUpDate", "Follow up"],
                          ] as Array<[SortKey, string]>
                        ).map(([key, label]) => (
                          <th key={key} className="px-3 py-2 font-medium">
                            <button
                              type="button"
                              onClick={() => toggleSort(key)}
                              className={cn(
                                "inline-flex items-center gap-1 hover:text-foreground",
                                sortKey === key && "text-foreground",
                              )}
                            >
                              {label}
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </th>
                        ))}
                        <th className="px-3 py-2 font-medium">Interview</th>
                        <th className="hidden px-3 py-2 font-medium 2xl:table-cell">Comp.</th>
                        <th className="px-3 py-2 text-right font-medium">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((app) => {
                        const followUpOverdue =
                          app.followUpDate !== undefined &&
                          app.followUpDate <= today &&
                          STATUS_META[app.status].stage === "open";
                        return (
                          <tr
                            key={app.id}
                            onClick={() => openEdit(app)}
                            className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-elevated"
                          >
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2 font-medium">
                                {app.company}
                                {app.url && (
                                  <a
                                    href={app.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-muted-foreground hover:text-foreground"
                                    aria-label="Open job posting"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {app.role}
                                {app.location && <span> · {app.location}</span>}
                                {app.workMode && <span> · {WORK_MODE_LABEL[app.workMode]}</span>}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={app.status} />
                            </td>
                            <td className="px-3 py-2">
                              <PriorityDot priority={app.priority} />
                            </td>
                            <td className="tabular whitespace-nowrap px-3 py-2 text-muted-foreground">
                              {formatMediumDate(app.appliedDate)}
                            </td>
                            <td className="tabular whitespace-nowrap px-3 py-2 text-muted-foreground">
                              {app.followUpDate ? (
                                <span className={cn(followUpOverdue && "font-medium text-amber-600 dark:text-amber-400")}>
                                  {formatMediumDate(app.followUpDate)}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="tabular whitespace-nowrap px-3 py-2 text-muted-foreground">
                              {app.interviewDate ? formatMediumDate(app.interviewDate) : "—"}
                            </td>
                            <td className="hidden max-w-[120px] truncate px-3 py-2 text-xs text-muted-foreground 2xl:table-cell">
                              {app.compensation ?? "—"}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-end gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(app);
                                  }}
                                  aria-label={`Edit ${app.company}`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestDelete(app);
                                  }}
                                  aria-label={`Delete ${app.company}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                            Nothing matches these filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {boardColumns.map((status) => {
                  const column = filtered.filter((app) => app.status === status);
                  return (
                    <div key={status} className="w-56 shrink-0">
                      <div className="mb-2 flex items-center justify-between px-1">
                        <StatusBadge status={status} />
                        <span className="tabular text-xs text-muted-foreground">{column.length}</span>
                      </div>
                      <div className="space-y-2">
                        {column.map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => openEdit(app)}
                            className="surface surface-interactive w-full p-3 text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{app.company}</div>
                                <div className="truncate text-xs text-muted-foreground">{app.role}</div>
                              </div>
                              <PriorityDot priority={app.priority} />
                            </div>
                            <div className="tabular mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{formatMediumDate(app.appliedDate)}</span>
                              {app.interviewDate && app.interviewDate >= today && (
                                <span className="text-primary">Int. {formatMediumDate(app.interviewDate)}</span>
                              )}
                            </div>
                          </button>
                        ))}
                        {column.length === 0 && (
                          <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                            Empty
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <Funnel stats={stats} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>By status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {PIPELINE_ORDER.filter((status) => stats.byStatus[status] > 0).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className="flex w-full items-center justify-between rounded px-1.5 py-1 text-xs hover:bg-elevated"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: STATUS_META[status].accent }}
                      />
                      {STATUS_META[status].label}
                    </span>
                    <span className="tabular font-medium">{stats.byStatus[status]}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(values) => {
          if (editing) applications.update(editing.id, values);
          else applications.create(values);
        }}
      />
      {confirmDialog}
    </div>
  );
}
