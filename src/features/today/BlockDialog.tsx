import { useEffect, useState, type FormEvent } from "react";
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
import { CATEGORY_META } from "@/data/defaultPlan";
import { PRIORITY_META } from "@/data/pipeline";
import { uid } from "@/lib/utils";
import {
  BLOCK_CATEGORIES,
  PRIORITIES,
  type BlockCategory,
  type CounterId,
  type PlanBlock,
  type Priority,
} from "@/types";

const COUNTER_OPTIONS: Array<{ value: CounterId; label: string }> = [
  { value: "applications", label: "Applications" },
  { value: "recruiters", label: "Recruiter conversations" },
  { value: "dsa", label: "Problems solved" },
  { value: "studyHours", label: "Study hours" },
  { value: "commits", label: "Commits" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: PlanBlock | null;
  onSubmit: (values: Omit<PlanBlock, "id">) => void;
}

interface FormState {
  title: string;
  start: string;
  end: string;
  category: BlockCategory;
  priority: Priority;
  description: string;
  /** One task per line. */
  tasks: string;
  counter: CounterId | "";
  byWeekday: Record<number, string>;
}

const emptyForm = (): FormState => ({
  title: "",
  start: "09:00",
  end: "10:00",
  category: "deep-work",
  priority: "medium",
  description: "",
  tasks: "",
  counter: "",
  byWeekday: {},
});

const toForm = (block: PlanBlock): FormState => ({
  title: block.title,
  start: block.start,
  end: block.end,
  category: block.category,
  priority: block.priority,
  description: block.description ?? "",
  tasks: block.tasks.map((task) => task.label).join("\n"),
  counter: block.counter ?? "",
  byWeekday: { ...(block.byWeekday ?? {}) },
});

export function BlockDialog({ open, onOpenChange, editing, onSubmit }: BlockDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [showWeekdays, setShowWeekdays] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(editing ? toForm(editing) : emptyForm());
      setShowWeekdays(Boolean(editing?.byWeekday && Object.keys(editing.byWeekday).length));
    }
  }, [open, editing]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    // Existing task ids are kept by matching on label, so ticks survive a rename
    // of the block while a renamed task starts fresh (it is a different task).
    const existingByLabel = new Map(editing?.tasks.map((task) => [task.label, task.id]) ?? []);
    const tasks = form.tasks
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((label) => ({ id: existingByLabel.get(label) ?? uid(), label }));

    const byWeekday: Record<number, string> = {};
    for (const [day, focus] of Object.entries(form.byWeekday)) {
      if (focus.trim()) byWeekday[Number(day)] = focus.trim();
    }

    onSubmit({
      title: form.title.trim(),
      start: form.start,
      end: form.end < form.start ? form.start : form.end,
      category: form.category,
      priority: form.priority,
      description: form.description.trim() || undefined,
      tasks,
      counter: form.counter || undefined,
      byWeekday: Object.keys(byWeekday).length ? byWeekday : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit block" : "Add block"}</DialogTitle>
          <DialogDescription>
            A block is a time range with a checklist. Keep them few and honest.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Title">
            <Input
              autoFocus
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Deep Work"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Start">
              <Input type="time" required value={form.start} onChange={(e) => set("start", e.target.value)} />
            </Field>
            <Field label="End">
              <Input type="time" required value={form.end} onChange={(e) => set("end", e.target.value)} />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => set("category", e.target.value as BlockCategory)}>
                {BLOCK_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_META[category].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => set("priority", e.target.value as Priority)}>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_META[priority].label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <FieldRow>
            <Field label="Description" className="sm:col-span-2">
              <Input
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Optional one-liner about what this block is for"
              />
            </Field>
          </FieldRow>
          <Field label="Checklist" hint="One task per line. These become today's tick boxes.">
            <Textarea
              value={form.tasks}
              onChange={(e) => set("tasks", e.target.value)}
              placeholder={"Ship today's most important thing\nReview what you shipped"}
              className="min-h-[96px] font-mono text-xs"
            />
          </Field>
          <FieldRow>
            <Field label="Counter shown on this block" hint="Optional quick +/- logging inside the block.">
              <Select value={form.counter} onChange={(e) => set("counter", e.target.value as CounterId | "")}>
                <option value="">None</option>
                {COUNTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowWeekdays((v) => !v)}>
                {showWeekdays ? "Hide" : "Set"} weekday focus
              </Button>
            </div>
          </FieldRow>
          {showWeekdays && (
            <div className="grid gap-2 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <Field key={day} label={WEEKDAYS[day]}>
                  <Input
                    value={form.byWeekday[day] ?? ""}
                    onChange={(e) => set("byWeekday", { ...form.byWeekday, [day]: e.target.value })}
                    placeholder="e.g. System design"
                  />
                </Field>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save block" : "Add block"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
