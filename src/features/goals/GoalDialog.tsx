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
import type { GoalInput } from "@/context/DataContext";
import { GOAL_CATEGORY_META } from "@/data/goals";
import {
  GOAL_CATEGORIES,
  GOAL_PERIODS,
  type CounterId,
  type Goal,
  type GoalCategory,
  type GoalPeriod,
} from "@/types";

/** Counters a goal can be measured against, with human labels. */
export const COUNTER_LABEL: Record<CounterId, string> = {
  applications: "Applications sent",
  recruiters: "Recruiter / referral conversations",
  alumni: "Alumni messaged",
  hiringManagers: "Hiring managers messaged",
  dsa: "Problems solved",
  studyHours: "Study hours",
  commits: "Commits",
  linkedinPosts: "Posts published",
  focusSessions: "Focus sessions",
  focusMinutes: "Focus minutes",
};

const COUNTER_CHOICES: CounterId[] = [
  "applications",
  "recruiters",
  "dsa",
  "studyHours",
  "commits",
  "focusSessions",
  "focusMinutes",
  "linkedinPosts",
];

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Goal | null;
  onSubmit: (values: GoalInput) => void;
}

const emptyForm = (): GoalInput => ({
  label: "",
  counter: "applications",
  target: 5,
  period: "daily",
  category: "career",
});

export function GoalDialog({ open, onOpenChange, editing, onSubmit }: GoalDialogProps) {
  const [form, setForm] = useState<GoalInput>(emptyForm());

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? { label: editing.label, counter: editing.counter, target: editing.target, period: editing.period, category: editing.category }
          : emptyForm(),
      );
    }
  }, [open, editing]);

  const set = <K extends keyof GoalInput>(key: K, value: GoalInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const label = form.label.trim() || COUNTER_LABEL[form.counter];
    onSubmit({ ...form, label, target: Math.max(1, Math.round(form.target)) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit goal" : "Add goal"}</DialogTitle>
          <DialogDescription>Goals are measured against the counters you log on Today.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Measured by">
            <Select value={form.counter} onChange={(e) => set("counter", e.target.value as CounterId)}>
              {COUNTER_CHOICES.map((counter) => (
                <option key={counter} value={counter}>
                  {COUNTER_LABEL[counter]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Label" hint="Optional: defaults to the counter name.">
            <Input value={form.label} onChange={(e) => set("label", e.target.value)} placeholder={COUNTER_LABEL[form.counter]} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Target">
              <Input
                type="number"
                min={1}
                required
                value={form.target}
                onChange={(e) => set("target", Number(e.target.value) || 1)}
              />
            </Field>
            <Field label="Period">
              <Select value={form.period} onChange={(e) => set("period", e.target.value as GoalPeriod)}>
                {GOAL_PERIODS.map((period) => (
                  <option key={period} value={period}>
                    {period[0].toUpperCase() + period.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => set("category", e.target.value as GoalCategory)}>
                {GOAL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {GOAL_CATEGORY_META[category].label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <FieldRow>
            <div />
          </FieldRow>
          <DialogFooter className="-mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save goal" : "Add goal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
