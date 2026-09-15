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
import type { LogEntryInput } from "@/context/DataContext";
import { LOG_CATEGORY_META } from "@/data/pipeline";
import { todayISO } from "@/lib/dates";
import { LOG_CATEGORIES, type LogCategory, type LogEntry, type Project } from "@/types";

interface LogEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: LogEntry | null;
  projects: Project[];
  onSubmit: (values: LogEntryInput) => void;
}

interface FormState {
  date: string;
  category: LogCategory;
  title: string;
  description: string;
  technologies: string[];
  impact: string;
  lessons: string;
  projectId: string;
}

const emptyForm = (): FormState => ({
  date: todayISO(),
  category: "learning",
  title: "",
  description: "",
  technologies: [],
  impact: "",
  lessons: "",
  projectId: "",
});

const toForm = (entry: LogEntry): FormState => ({
  date: entry.date,
  category: entry.category,
  title: entry.title,
  description: entry.description,
  technologies: entry.technologies,
  impact: entry.impact ?? "",
  lessons: entry.lessons ?? "",
  projectId: entry.projectId ?? "",
});

export function LogEntryDialog({ open, onOpenChange, editing, projects, onSubmit }: LogEntryDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    if (open) setForm(editing ? toForm(editing) : emptyForm());
  }, [open, editing]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({
      date: form.date,
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      technologies: form.technologies,
      impact: form.impact.trim() || undefined,
      lessons: form.lessons.trim() || undefined,
      projectId: form.projectId || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit entry" : "Log engineering work"}</DialogTitle>
          <DialogDescription>
            Specific beats impressive. What was broken, what you did, what changed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Title">
            <Input
              autoFocus
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Cut API p95 from 1.4s to 210ms"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date">
              <Input type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => set("category", e.target.value as LogCategory)}>
                {LOG_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {LOG_CATEGORY_META[category].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Project">
              <Select value={form.projectId} onChange={(e) => set("projectId", e.target.value)}>
                <option value="">None</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="What happened">
            <Textarea
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Context, root cause, what you changed."
              className="min-h-[90px]"
            />
          </Field>
          <Field label="Technologies">
            <TagInput value={form.technologies} onChange={(next) => set("technologies", next)} />
          </Field>
          <FieldRow>
            <Field label="Impact" hint="A number if you have one.">
              <Textarea value={form.impact} onChange={(e) => set("impact", e.target.value)} className="min-h-[60px]" />
            </Field>
            <Field label="Lessons">
              <Textarea value={form.lessons} onChange={(e) => set("lessons", e.target.value)} className="min-h-[60px]" />
            </Field>
          </FieldRow>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save entry" : "Add entry"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
