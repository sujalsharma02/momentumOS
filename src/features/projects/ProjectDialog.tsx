import { useEffect, useState, type FormEvent } from "react";
import { TagInput } from "@/components/shared/TagInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldRow } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectInput } from "@/context/DataContext";
import { PROJECT_STATUS_META } from "@/data/projects";
import { uid } from "@/lib/utils";
import { PROJECT_STATUSES, type Project, type ProjectStatus } from "@/types";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Project | null;
  onSubmit: (values: ProjectInput) => void;
}

interface FormState {
  name: string;
  description: string;
  status: ProjectStatus;
  stack: string[];
  problem: string;
  architecture: string;
  deployment: string;
  repoUrl: string;
  liveUrl: string;
  /** One per line. */
  achievements: string;
  /** One per line. */
  tasks: string;
  challenges: string;
  lessons: string;
}

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  status: "building",
  stack: [],
  problem: "",
  architecture: "",
  deployment: "",
  repoUrl: "",
  liveUrl: "",
  achievements: "",
  tasks: "",
  challenges: "",
  lessons: "",
});

const toForm = (project: Project): FormState => ({
  name: project.name,
  description: project.description,
  status: project.status,
  stack: project.stack,
  problem: project.problem ?? "",
  architecture: project.architecture ?? "",
  deployment: project.deployment ?? "",
  repoUrl: project.repoUrl ?? "",
  liveUrl: project.liveUrl ?? "",
  achievements: project.achievements.join("\n"),
  tasks: project.tasks.map((task) => (task.done ? `[x] ${task.label}` : task.label)).join("\n"),
  challenges: project.challenges ?? "",
  lessons: project.lessons ?? "",
});

const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const clean = (value: string) => (value.trim() ? value.trim() : undefined);

export function ProjectDialog({ open, onOpenChange, editing, onSubmit }: ProjectDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    if (open) setForm(editing ? toForm(editing) : emptyForm());
  }, [open, editing]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    const existingByLabel = new Map(editing?.tasks.map((task) => [task.label, task]) ?? []);
    const tasks = lines(form.tasks).map((line) => {
      const doneMarker = /^\[x\]\s*/i.test(line);
      const label = line.replace(/^\[[ x]\]\s*/i, "");
      const existing = existingByLabel.get(label);
      return { id: existing?.id ?? uid(), label, done: doneMarker || (existing?.done ?? false) };
    });

    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      stack: form.stack,
      problem: clean(form.problem),
      architecture: clean(form.architecture),
      deployment: clean(form.deployment),
      repoUrl: clean(form.repoUrl),
      liveUrl: clean(form.liveUrl),
      achievements: lines(form.achievements),
      tasks,
      challenges: clean(form.challenges),
      lessons: clean(form.lessons),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit project" : "Add project"}</DialogTitle>
          <DialogDescription>
            Write it the way you would explain it in an interview: the problem, the shape of the
            solution, and what you would do differently.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <FieldRow>
            <Field label="Name">
              <Input autoFocus required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value as ProjectStatus)}>
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_META[status].label}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldRow>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What it is, in two sentences."
              className="min-h-[60px]"
            />
          </Field>
          <Field label="Tech stack">
            <TagInput value={form.stack} onChange={(next) => set("stack", next)} placeholder="FastAPI, PostgreSQL, React..." />
          </Field>
          <Field label="Problem solved">
            <Textarea value={form.problem} onChange={(e) => set("problem", e.target.value)} className="min-h-[60px]" placeholder="Who had the problem and what it cost them." />
          </Field>
          <Field label="Architecture">
            <Textarea value={form.architecture} onChange={(e) => set("architecture", e.target.value)} className="min-h-[60px]" placeholder="The main components and how data moves between them." />
          </Field>
          <FieldRow>
            <Field label="Deployment">
              <Input value={form.deployment} onChange={(e) => set("deployment", e.target.value)} placeholder="Docker on a VPS, Vercel, ..." />
            </Field>
            <Field label="GitHub URL">
              <Input type="url" value={form.repoUrl} onChange={(e) => set("repoUrl", e.target.value)} placeholder="https://github.com/..." />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Live URL">
              <Input type="url" value={form.liveUrl} onChange={(e) => set("liveUrl", e.target.value)} placeholder="https://" />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Key achievements" hint="One per line. Numbers where you have them.">
              <Textarea value={form.achievements} onChange={(e) => set("achievements", e.target.value)} className="min-h-[80px] font-mono text-xs" />
            </Field>
            <Field label="Current tasks" hint="One per line. Prefix with [x] for done.">
              <Textarea value={form.tasks} onChange={(e) => set("tasks", e.target.value)} className="min-h-[80px] font-mono text-xs" />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Challenges">
              <Textarea value={form.challenges} onChange={(e) => set("challenges", e.target.value)} className="min-h-[60px]" />
            </Field>
            <Field label="Lessons learned">
              <Textarea value={form.lessons} onChange={(e) => set("lessons", e.target.value)} className="min-h-[60px]" />
            </Field>
          </FieldRow>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save project" : "Add project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
