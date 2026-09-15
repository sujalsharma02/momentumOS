import { Check, ExternalLink, Github, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Stat, StatStrip } from "@/components/shared/Stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useData } from "@/context/DataContext";
import { LOG_CATEGORY_META } from "@/data/pipeline";
import { PROJECT_STATUS_META } from "@/data/projects";
import { formatMediumDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";
import { ProjectDialog } from "@/features/projects/ProjectDialog";

const STATUS_ORDER: ProjectStatus[] = ["building", "shipped", "maintaining", "idea", "archived"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="eyebrow mb-1">{title}</h4>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export function ProjectsPage() {
  const { projects, engineeringLog } = useData();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");

  const sorted = useMemo(
    () =>
      [...projects.items].sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || b.updatedAt - a.updatedAt,
      ),
    [projects.items],
  );

  const visible = statusFilter === "all" ? sorted : sorted.filter((p) => p.status === statusFilter);
  const selected = projects.items.find((p) => p.id === selectedId) ?? null;
  const selectedLog = selected ? engineeringLog.items.filter((e) => e.projectId === selected.id) : [];

  const counts = useMemo(() => {
    const byStatus: Record<ProjectStatus, number> = { idea: 0, building: 0, shipped: 0, maintaining: 0, archived: 0 };
    for (const p of projects.items) byStatus[p.status] += 1;
    return byStatus;
  }, [projects.items]);
  const openTasks = projects.items.reduce((n, p) => n + p.tasks.filter((t) => !t.done).length, 0);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (project: Project) => {
    setEditing(project);
    setFormOpen(true);
  };
  const requestDelete = (project: Project) =>
    confirm({
      title: `Delete ${project.name}?`,
      description: "The project and its task list will be removed. Engineering log entries are kept.",
      onConfirm: () => {
        projects.remove(project.id);
        if (selectedId === project.id) setSelectedId(null);
      },
    });

  const toggleTask = (project: Project, taskId: string) =>
    projects.update(project.id, {
      tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    });

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Portfolio work, written up as the evidence it becomes in an interview."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add project
          </Button>
        }
      />

      <StatStrip className="mb-4">
        <Stat label="Building" value={counts.building} accent={PROJECT_STATUS_META.building.accent} />
        <Stat label="Shipped" value={counts.shipped + counts.maintaining} accent={PROJECT_STATUS_META.shipped.accent} />
        <Stat label="Ideas" value={counts.idea} />
        <Stat label="Open tasks" value={openTasks} />
        <Stat label="Log entries linked" value={engineeringLog.items.filter((e) => e.projectId).length} />
      </StatStrip>

      {projects.items.length === 0 ? (
        <EmptyState
          icon="Boxes"
          title="No projects yet"
          description="Each project here is a career asset: the problem, the architecture, what shipped and what you learned. Add the thing you are building right now."
          action={
            <Button onClick={openCreate}>
              <Plus /> Add project
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(["all", ...STATUS_ORDER] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" ? "All" : PROJECT_STATUS_META[status].label}
                {status !== "all" && <span className="tabular ml-1 text-muted-foreground">{counts[status]}</span>}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((project) => {
              const meta = PROJECT_STATUS_META[project.status];
              const done = project.tasks.filter((t) => t.done).length;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedId(project.id)}
                  className="surface surface-interactive flex flex-col p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold">{project.name}</h3>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {project.description || "No description yet."}
                  </p>
                  {project.stack.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {project.stack.slice(0, 5).map((tech) => (
                        <span key={tech} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium">
                          {tech}
                        </span>
                      ))}
                      {project.stack.length > 5 && (
                        <span className="px-1 text-[10px] text-muted-foreground">+{project.stack.length - 5}</span>
                      )}
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-muted-foreground">
                    <span>
                      {project.achievements.length} achievement{project.achievements.length === 1 ? "" : "s"}
                      {project.tasks.length > 0 && (
                        <>
                          <span className="mx-1">·</span>
                          {done}/{project.tasks.length} tasks
                        </>
                      )}
                    </span>
                    <span className="tabular">{formatMediumDate(new Date(project.updatedAt).toISOString().slice(0, 10))}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {visible.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No projects with this status.</p>
          )}
        </>
      )}

      {/* Detail */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-lg">{selected.name}</DialogTitle>
                  <Badge variant={PROJECT_STATUS_META[selected.status].variant}>
                    {PROJECT_STATUS_META[selected.status].label}
                  </Badge>
                </div>
                <DialogDescription>{selected.description || "No description yet."}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2">
                {selected.repoUrl && (
                  <Button asChild variant="outline" size="sm">
                    <a href={selected.repoUrl} target="_blank" rel="noreferrer">
                      <Github /> Repository
                    </a>
                  </Button>
                )}
                {selected.liveUrl && (
                  <Button asChild variant="outline" size="sm">
                    <a href={selected.liveUrl} target="_blank" rel="noreferrer">
                      <ExternalLink /> Live
                    </a>
                  </Button>
                )}
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(selected)}>
                    <Pencil /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:text-destructive" onClick={() => requestDelete(selected)}>
                    <Trash2 /> Delete
                  </Button>
                </div>
              </div>

              {selected.stack.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selected.stack.map((tech) => (
                    <span key={tech} className="rounded bg-secondary px-2 py-0.5 text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {selected.problem && <Section title="Problem solved">{selected.problem}</Section>}
                {selected.architecture && <Section title="Architecture">{selected.architecture}</Section>}
                {selected.deployment && <Section title="Deployment">{selected.deployment}</Section>}
                {selected.challenges && <Section title="Challenges">{selected.challenges}</Section>}
                {selected.lessons && <Section title="Lessons learned">{selected.lessons}</Section>}
              </div>

              {selected.achievements.length > 0 && (
                <Section title="Key achievements">
                  <ul className="list-disc space-y-1 pl-4">
                    {selected.achievements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {selected.tasks.length > 0 && (
                <Section title="Current tasks">
                  <div className="grid gap-0.5">
                    {selected.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => toggleTask(selected, task.id)}
                        className={cn(
                          "group flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-elevated",
                          task.done && "text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            task.done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                          )}
                        >
                          {task.done && <Check className="h-3 w-3" />}
                        </span>
                        <span className={cn(task.done && "line-through")}>{task.label}</span>
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              <Section title={`Engineering log (${selectedLog.length})`}>
                {selectedLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No entries linked yet.{" "}
                    <Link to="/log" className="text-primary underline-offset-2 hover:underline">
                      Add one in the Engineering Log
                    </Link>{" "}
                    and choose this project.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {selectedLog.slice(0, 6).map((entry) => (
                      <li key={entry.id} className="flex items-center gap-2 text-xs">
                        <DynamicIcon
                          name={LOG_CATEGORY_META[entry.category].icon}
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: LOG_CATEGORY_META[entry.category].accent }}
                        />
                        <span className="truncate">{entry.title}</span>
                        <span className="tabular ml-auto shrink-0 text-muted-foreground">
                          {formatMediumDate(entry.date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ProjectDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSubmit={(values) => {
          if (editing) projects.update(editing.id, values);
          else {
            const created = projects.create(values);
            setSelectedId(created.id);
          }
        }}
      />
      {confirmDialog}
    </div>
  );
}
