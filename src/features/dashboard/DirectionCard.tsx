import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import { MILESTONE_STATUS_META } from "@/features/roadmap/MilestoneDialog";

/**
 * Long-term direction as a compact vertical progression. Replaces the old
 * "Dream Meter": same idea, expressed as milestones you can actually edit.
 */
export function DirectionCard() {
  const { roadmap } = useData();
  const milestones = roadmap.items;
  const reached = milestones.filter((m) => m.status === "done").length;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>Direction</CardTitle>
        <Link to="/roadmap" className="text-xs text-muted-foreground hover:text-foreground">
          Roadmap
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No milestones yet.{" "}
            <Link to="/roadmap" className="text-primary underline-offset-2 hover:underline">
              Set the path.
            </Link>
          </p>
        ) : (
          <ol className="relative space-y-0 pl-5">
            <div className="absolute bottom-2.5 left-[5px] top-2.5 w-px bg-border" aria-hidden />
            {milestones.map((m) => {
              const meta = MILESTONE_STATUS_META[m.status];
              const isDone = m.status === "done";
              const isActive = m.status === "active";
              return (
                <li key={m.id} className="relative py-1.5">
                  <span
                    className={cn(
                      "absolute -left-5 top-[9px] flex h-[11px] w-[11px] items-center justify-center rounded-full border-2 bg-background",
                      isDone ? "border-emerald-500 bg-emerald-500" : isActive ? "border-primary" : "border-border",
                    )}
                    aria-hidden
                  >
                    {isDone && <Check className="h-2 w-2 text-white" />}
                    {isActive && <span className="h-1 w-1 rounded-full bg-primary" />}
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-sm", isActive ? "font-semibold" : isDone ? "text-muted-foreground line-through" : "text-muted-foreground")}>
                      {m.title}
                    </span>
                    {isActive && (
                      <span className="tabular text-[11px]" style={{ color: meta.accent }}>
                        {m.progress}%
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {milestones.length > 0 && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            {reached} of {milestones.length} reached
          </p>
        )}
      </CardContent>
    </Card>
  );
}
