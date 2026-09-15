import type { PipelineStats } from "@/lib/stats";

interface FunnelProps {
  stats: PipelineStats;
}

/**
 * Sent -> responded -> interviewed -> offers, with the conversion between each
 * stage. Widths are relative to "sent" so a stage can never look bigger than
 * the one before it.
 */
export function Funnel({ stats }: FunnelProps) {
  const stages = [
    { label: "Sent", value: stats.sent, accent: "#3987e5", rate: undefined as number | undefined },
    { label: "Responded", value: stats.responded, accent: "#5b8def", rate: stats.responseRate },
    { label: "Interviewed", value: stats.interviewed, accent: "#c98500", rate: stats.interviewRate },
    { label: "Offers", value: stats.offers, accent: "#0ca30c", rate: stats.offerRate },
  ];
  const max = Math.max(1, stats.sent);

  return (
    <div className="space-y-2.5">
      {stages.map((stage, index) => (
        <div key={stage.label} className="grid grid-cols-[88px,1fr,auto] items-center gap-3 text-xs">
          <span className="font-medium">{stage.label}</span>
          <div className="h-5 overflow-hidden rounded bg-secondary">
            <div
              className="h-full rounded transition-[width] duration-500"
              style={{
                width: `${Math.max(stage.value > 0 ? 3 : 0, (stage.value / max) * 100)}%`,
                backgroundColor: stage.accent,
              }}
            />
          </div>
          <span className="tabular w-24 text-right text-muted-foreground">
            <span className="font-semibold text-foreground">{stage.value}</span>
            {index > 0 && stage.rate !== undefined && (
              <span className="ml-1.5">
                {stage.rate}%{index === 3 ? " of int." : ""}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
