import { motion } from "framer-motion";
import { ArrowUpDown, CalendarClock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useData } from "@/context/DataContext";
import { formatMediumDate, todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, JobApplication } from "@/types";
import { ApplicationDialog, STATUS_OPTIONS } from "@/features/tracker/ApplicationDialog";

type SortKey = "company" | "role" | "appliedDate" | "status";

const STATUS_BADGE: Record<ApplicationStatus, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  applied: { label: "Applied", variant: "secondary" },
  interview: { label: "Interview", variant: "warning" },
  offer: { label: "Offer", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function TrackerPage() {
  const { applications, addApplication, updateApplication, deleteApplication, loadDemoData } = useData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("appliedDate");
  const [sortAsc, setSortAsc] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = applications.filter((app) => {
      const matchesQuery =
        !q || app.company.toLowerCase().includes(q) || app.role.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    const direction = sortAsc ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      return av < bv ? -direction : av > bv ? direction : 0;
    });
  }, [applications, query, statusFilter, sortKey, sortAsc]);

  const counts = useMemo(() => {
    const byStatus = { applied: 0, interview: 0, offer: 0, rejected: 0 };
    for (const app of applications) byStatus[app.status] += 1;
    return byStatus;
  }, [applications]);

  const responseRate =
    applications.length === 0
      ? 0
      : Math.round(((counts.interview + counts.offer) / applications.length) * 100);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(key === "company" || key === "role");
    }
  };

  const followUpsDue = applications.filter(
    (app) => app.followUpDate && app.followUpDate <= todayISO() && app.status === "applied",
  ).length;

  return (
    <div>
      <PageHeader
        title="Job Application Tracker"
        description="Every application is a data point. Track the funnel, learn, iterate."
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus /> Add application
          </Button>
        }
      />

      {/* Funnel summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: applications.length, accent: "#8b5cf6" },
          { label: "Applied", value: counts.applied, accent: "#898791" },
          { label: "Interviews", value: counts.interview, accent: "#c98500" },
          { label: "Offers", value: counts.offer, accent: "#0ca30c" },
          { label: "Response rate", value: `${responseRate}%`, accent: "#22d3ee" },
        ].map((tile) => (
          <Card key={tile.label} className="glass-hover">
            <CardContent className="p-4">
              <div className="tabular text-2xl font-bold" style={{ color: tile.accent }}>
                {tile.value}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{tile.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {followUpsDue > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          <CalendarClock className="h-4 w-4" />
          {followUpsDue} follow-up{followUpsDue === 1 ? "" : "s"} due — nudge them today.
        </div>
      )}

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or role…"
            className="pl-8"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="sm:w-44"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon="Briefcase"
          title="No applications yet"
          description="Add your first application, or load demo data to see the tracker in action."
          action={
            <div className="flex gap-2">
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus /> Add application
              </Button>
              <Button variant="outline" onClick={loadDemoData}>
                Load demo data
              </Button>
            </div>
          }
        />
      ) : (
        <div className="glass overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-muted-foreground">
                  {(
                    [
                      ["company", "Company"],
                      ["role", "Role"],
                      ["appliedDate", "Applied"],
                      ["status", "Status"],
                    ] as Array<[SortKey, string]>
                  ).map(([key, label]) => (
                    <th key={key} className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                          sortKey === key && "text-foreground",
                        )}
                      >
                        {label}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium">Follow up</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, index) => (
                  <motion.tr
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(index * 0.02, 0.3) }}
                    className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 font-medium">{app.company}</td>
                    <td className="px-4 py-3 text-muted-foreground">{app.role}</td>
                    <td className="tabular px-4 py-3 text-muted-foreground">
                      {formatMediumDate(app.appliedDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[app.status].variant}>
                        {STATUS_BADGE[app.status].label}
                      </Badge>
                    </td>
                    <td className="tabular px-4 py-3 text-muted-foreground">
                      {app.followUpDate ? (
                        <span
                          className={cn(
                            app.followUpDate <= todayISO() && app.status === "applied" && "font-medium text-amber-400",
                          )}
                        >
                          {formatMediumDate(app.followUpDate)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => { setEditing(app); setDialogOpen(true); }}
                          aria-label={`Edit ${app.company}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:text-red-400"
                          onClick={() => deleteApplication(app.id)}
                          aria-label={`Delete ${app.company}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      Nothing matches your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(values) => {
          if (editing) {
            updateApplication(editing.id, values);
          } else {
            addApplication(values);
          }
        }}
      />
    </div>
  );
}
