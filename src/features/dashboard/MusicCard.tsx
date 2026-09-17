import { Music4, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { STATIONS, useMusic } from "@/context/MusicContext";
import { cn } from "@/lib/utils";

/** Controls for the app-level player in MusicProvider; audio keeps playing after leaving this page. */
export function MusicCard() {
  const { station, playing, toggle, setStation } = useMusic();

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Music4 className="h-4 w-4 text-primary" /> Focus audio
        </CardTitle>
        <Select value={station.id} onChange={(e) => setStation(e.target.value)} className="w-40" aria-label="Station">
          {STATIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 items-center gap-4">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors",
            playing && "border-primary/40 bg-accent text-primary",
          )}
        >
          <Music4 className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{station.title}</div>
          <div className="text-xs text-muted-foreground">{station.sub}</div>
          <div className="mt-2 flex h-4 items-end gap-[3px]" aria-hidden>
            {[0.9, 0.5, 1, 0.65, 0.8].map((peak, i) => (
              <span
                key={i}
                className={cn("w-[3px] rounded-full bg-primary transition-all", playing && "animate-pulse-soft")}
                style={{ height: playing ? `${peak * 16}px` : "3px", animationDelay: `${i * 130}ms` }}
              />
            ))}
          </div>
        </div>
        <Button size="icon" onClick={toggle} className="h-11 w-11 rounded-full" aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause className="!size-5" /> : <Play className="ml-0.5 !size-5" />}
        </Button>
      </CardContent>
    </Card>
  );
}
