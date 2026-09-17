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
import type { MilestoneInput } from "@/context/DataContext";
import { MILESTONE_STATUSES, type Milestone, type MilestoneStatus } from "@/types";

export const MILESTONE_STATUS_META: Record<MilestoneStatus, { label: string; accent: string }> = {
  done: { label: "Done", accent: "#0ca30c" },
  active: { label: "In progress", accent: "#f04e23" },
  next: { label: "Next", accent: "#3987e5" },
  later: { label: "Later", accent: "#898791" },
};

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Milestone | null;
  onSubmit: (values: MilestoneInput) => void;
}

interface FormState {
  title: string;
  detail: string;
  targetDate: string;
  status: MilestoneStatus;
  progress: number;
  notes: string;
}

const emptyForm = (): FormState => ({
  title: "",
  detail: "",
  targetDate: "",
  status: "later",
  progress: 0,
  notes: "",
});

const toForm = (m: Milestone): FormState => ({
  title: m.title,
  detail: m.detail ?? "",
  targetDate: m.targetDate ?? "",
  status: m.status,
  progress: m.progress,
  notes: m.notes ?? "",
});

export function MilestoneDialog({ open, onOpenChange, editing, onSubmit }: MilestoneDialogProps) {
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
      title: form.title.trim(),
      detail: form.detail.trim() || undefined,
      targetDate: form.targetDate || undefined,
      status: form.status,
      progress: form.status === "done" ? 100 : form.progress,
      notes: form.notes.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit milestone" : "Add milestone"}</DialogTitle>
          <DialogDescription>Target dates are optional. A guess written down is still a guess.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Title">
            <Input autoFocus required value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="What it means">
            <Textarea
              value={form.detail}
              onChange={(e) => set("detail", e.target.value)}
              placeholder="What has to be true for this to count as reached."
              className="min-h-[70px]"
            />
          </Field>
          <FieldRow>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value as MilestoneStatus)}>
                {MILESTONE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {MILESTONE_STATUS_META[status].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Target (optional)">
              <Input type="date" value={form.targetDate} onChange={(e) => set("targetDate", e.target.value)} />
            </Field>
          </FieldRow>
          <Field label={`Progress: ${form.progress}%`} hint="Self-assessed. Nothing here is computed for you.">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.status === "done" ? 100 : form.progress}
              disabled={form.status === "done"}
              onChange={(e) => set("progress", Number(e.target.value))}
              className="w-full accent-[hsl(var(--primary))]"
            />
          </Field>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[60px]" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save" : "Add milestone"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
