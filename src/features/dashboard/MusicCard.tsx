import { Music4, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMBED_ORIGIN = "https://www.youtube-nocookie.com";

const STATIONS = [
  { id: "jfKfPfyJRdk", title: "lofi hip hop radio", sub: "beats to relax/study to" },
  { id: "4xDzrJKXOOY", title: "synthwave radio", sub: "beats to chill/game to" },
  { id: "Dx5qFachd3A", title: "jazz lofi radio", sub: "beats to chill/study to" },
  { id: "l-2hOKIrIyI", title: "Luffy Mode", sub: "One Piece grind fuel" },
];

/**
 * Audio-only player. The YouTube iframe is mounted invisibly on first play so
 * sound is allowed by the click's user activation, then driven through the
 * IFrame postMessage API. Changing station remounts the iframe.
 */
export function MusicCard() {
  const [station, setStation] = useState(() => localStorage.getItem("momentum-os:station") ?? STATIONS[0].id);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const current = STATIONS.find((s) => s.id === station) ?? STATIONS[0];

  useEffect(() => {
    localStorage.setItem("momentum-os:station", station);
  }, [station]);

  const send = (func: "playVideo" | "pauseVideo") =>
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), EMBED_ORIGIN);

  const toggle = () => {
    if (!loaded) {
      setLoaded(true);
      setPlaying(true);
      return;
    }
    send(playing ? "pauseVideo" : "playVideo");
    setPlaying((v) => !v);
  };

  const changeStation = (id: string) => {
    setStation(id);
    setLoaded(false);
    setPlaying(false);
  };

  return (
    <Card className="relative flex flex-col overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Music4 className="h-4 w-4 text-primary" /> Focus audio
        </CardTitle>
        <Select value={station} onChange={(e) => changeStation(e.target.value)} className="w-40" aria-label="Station">
          {STATIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
          <img src={`https://i.ytimg.com/vi/${current.id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" loading="lazy" />
          {playing && <span className="absolute inset-0 bg-black/30" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{current.title}</div>
          <div className="text-xs text-muted-foreground">{current.sub}</div>
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
        {loaded && (
          <iframe
            key={station}
            ref={iframeRef}
            className="pointer-events-none absolute h-px w-px opacity-0"
            src={`${EMBED_ORIGIN}/embed/${station}?autoplay=1&enablejsapi=1&loop=1&playlist=${station}`}
            title="Focus audio"
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            aria-hidden
          />
        )}
      </CardContent>
    </Card>
  );
}
