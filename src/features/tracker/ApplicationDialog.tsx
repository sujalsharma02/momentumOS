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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/lib/dates";
import type { ApplicationStatus, JobApplication } from "@/types";

export const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string }> = [
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** when set, the dialog edits this application instead of creating one */
  editing?: JobApplication | null;
  onSubmit: (values: Omit<JobApplication, "id">) => void;
}

const emptyForm = (): Omit<JobApplication, "id"> => ({
  company: "",
  role: "",
  appliedDate: todayISO(),
  status: "applied",
  followUpDate: undefined,
  notes: "",
});

export function ApplicationDialog({ open, onOpenChange, editing, onSubmit }: ApplicationDialogProps) {
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (open) {
      setForm(editing ? { ...editing } : emptyForm());
    }
  }, [open, editing]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    onSubmit({
      ...form,
      company: form.company.trim(),
      role: form.role.trim(),
      followUpDate: form.followUpDate || undefined,
      notes: form.notes?.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit application" : "Add application"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the status as you move through the funnel." : "Log it the moment you hit submit."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium">
              Company
              <Input
                autoFocus
                required
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Vercel"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Role
              <Input
                required
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="AI Full Stack Engineer"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-medium">
              Applied
              <Input
                type="date"
                required
                value={form.appliedDate}
                onChange={(e) => setForm((f) => ({ ...f, appliedDate: e.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Status
              <Select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ApplicationStatus }))}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Follow up
              <Input
                type="date"
                value={form.followUpDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value || undefined }))}
              />
            </label>
          </div>
          <label className="grid gap-1.5 text-sm font-medium">
            Notes
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Referral from X, recruiter said…"
              className="min-h-[60px]"
            />
          </label>
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
