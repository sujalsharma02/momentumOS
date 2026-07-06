import { motion } from "framer-motion";
import { ArrowRight, Award, Handshake, Mic2, Send, Telescope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { dreamMeterStats } from "@/lib/stats";

const METER_ITEMS = [
  { key: "applicationsThisMonth", label: "Applications this month", icon: Send, accent: "#8b5cf6" },
  { key: "recruitersThisMonth", label: "Recruiters contacted", icon: Handshake, accent: "#22d3ee" },
  { key: "interviews", label: "Interviews", icon: Mic2, accent: "#fbbf24" },
  { key: "offers", label: "Offers", icon: Award, accent: "#34d399" },
] as const;

/**
 * The morning reminder that the grind is working: monthly momentum numbers
 * plus the goal path — current mission, then the dream after it.
 */
export function DreamMeter() {
  const { logs, applications } = useData();
  const stats = dreamMeterStats(logs, applications);

  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl"
      />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Telescope className="h-4 w-4 text-primary" />
          Dream Meter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {METER_ITEMS.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
              className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <item.icon className="h-3.5 w-3.5" style={{ color: item.accent }} />
                {item.label}
              </div>
              <div className="tabular mt-1.5 text-2xl font-bold">{stats[item.key]}</div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/[0.06] p-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Current goal
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
                🎯 Land AI Full Stack Job
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Next goal
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
                🇩🇪 Germany
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {stats.offers > 0
              ? "An offer is on the table. The dream is no longer hypothetical."
              : stats.interviews > 0
                ? `${stats.interviews} interview${stats.interviews === 1 ? "" : "s"} landed — the funnel is working. Keep feeding it.`
                : "Every application is a lottery ticket you printed yourself. Keep printing."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
