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
import type { ApplicationInput } from "@/context/DataContext";
import { PIPELINE_ORDER, PRIORITY_META, STATUS_META, WORK_MODE_LABEL } from "@/data/pipeline";
import { todayISO } from "@/lib/dates";
import {
  PRIORITIES,
  WORK_MODES,
  type ApplicationStatus,
  type JobApplication,
  type Priority,
  type WorkMode,
} from "@/types";

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this application instead of creating one. */
  editing?: JobApplication | null;
  onSubmit: (values: ApplicationInput) => void;
}

const emptyForm = (): ApplicationInput => ({
  company: "",
  role: "",
  location: "",
  workMode: undefined,
  compensation: "",
  appliedDate: todayISO(),
  source: "",
  status: "applied",
  contact: "",
  followUpDate: undefined,
  interviewDate: undefined,
  notes: "",
  url: "",
  priority: "medium",
});

const toForm = (app: JobApplication): ApplicationInput => ({
  company: app.company,
  role: app.role,
  location: app.location ?? "",
  workMode: app.workMode,
  compensation: app.compensation ?? "",
  appliedDate: app.appliedDate,
  source: app.source ?? "",
  status: app.status,
  contact: app.contact ?? "",
  followUpDate: app.followUpDate,
  interviewDate: app.interviewDate,
  notes: app.notes ?? "",
  url: app.url ?? "",
  priority: app.priority,
});

const clean = (value?: string) => {
  const text = value?.trim();
  return text ? text : undefined;
};

export function ApplicationDialog({ open, onOpenChange, editing, onSubmit }: ApplicationDialogProps) {
  const [form, setForm] = useState<ApplicationInput>(emptyForm());

  useEffect(() => {
    if (open) setForm(editing ? toForm(editing) : emptyForm());
  }, [open, editing]);

  const set = <K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    onSubmit({
      ...form,
      company: form.company.trim(),
      role: form.role.trim(),
      location: clean(form.location),
      compensation: clean(form.compensation),
      source: clean(form.source),
      contact: clean(form.contact),
      notes: clean(form.notes),
      url: clean(form.url),
      followUpDate: form.followUpDate || undefined,
      interviewDate: form.interviewDate || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit application" : "Add application"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Move it through the pipeline as things happen."
              : "Company and role are enough to start; fill the rest in as you learn it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <FieldRow>
            <Field label="Company">
              <Input
                autoFocus
                required
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Personio"
              />
            </Field>
            <Field label="Role">
              <Input
                required
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                placeholder="Backend Engineer (Python)"
              />
            </Field>
          </FieldRow>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value as ApplicationStatus)}
              >
                {PIPELINE_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_META[status].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as Priority)}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_META[priority].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Applied on">
              <Input
                type="date"
                required
                value={form.appliedDate}
                onChange={(e) => set("appliedDate", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Location">
              <Input
                value={form.location ?? ""}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Berlin, DE"
              />
            </Field>
            <Field label="Work mode">
              <Select
                value={form.workMode ?? ""}
                onChange={(e) => set("workMode", (e.target.value || undefined) as WorkMode | undefined)}
              >
                <option value="">Not specified</option>
                {WORK_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {WORK_MODE_LABEL[mode]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Compensation">
              <Input
                value={form.compensation ?? ""}
                onChange={(e) => set("compensation", e.target.value)}
                placeholder="€70-85k / ₹30 LPA"
              />
            </Field>
          </div>

          <FieldRow>
            <Field label="Source">
              <Input
                value={form.source ?? ""}
                onChange={(e) => set("source", e.target.value)}
                placeholder="LinkedIn, referral, careers page"
              />
            </Field>
            <Field label="Contact">
              <Input
                value={form.contact ?? ""}
                onChange={(e) => set("contact", e.target.value)}
                placeholder="Recruiter or hiring manager"
              />
            </Field>
          </FieldRow>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Follow up on">
              <Input
                type="date"
                value={form.followUpDate ?? ""}
                onChange={(e) => set("followUpDate", e.target.value || undefined)}
              />
            </Field>
            <Field label="Interview on">
              <Input
                type="date"
                value={form.interviewDate ?? ""}
                onChange={(e) => set("interviewDate", e.target.value || undefined)}
              />
            </Field>
            <Field label="Job URL">
              <Input
                type="url"
                value={form.url ?? ""}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://"
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Interview format, who you spoke to, what they care about..."
              className="min-h-[72px]"
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save changes" : "Add application"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
