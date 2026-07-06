import { motion } from "framer-motion";
import { Music4, Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VIDEO_ID = "l-2hOKIrIyI";
const EMBED_ORIGIN = "https://www.youtube-nocookie.com";

/**
 * Audio-only hype anthem. The YouTube iframe is mounted invisibly on first
 * play (so sound is allowed via the click's user activation) and controlled
 * through the IFrame postMessage API — no video surface, just the anthem.
 */
export function MusicCard() {
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const sendCommand = (func: "playVideo" | "pauseVideo") => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      EMBED_ORIGIN,
    );
  };

  const toggle = () => {
    if (!loaded) {
      setLoaded(true);
      setPlaying(true);
      return;
    }
    sendCommand(playing ? "pauseVideo" : "playVideo");
    setPlaying((value) => !value);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Music4 className="h-4 w-4 text-primary" />
          Hype Anthem
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/[0.08]">
            <img
              src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`}
              alt="Anthem cover art"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {playing && <span className="absolute inset-0 bg-black/30" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">Luffy Mode 🏴‍☠️</div>
            <div className="text-xs text-muted-foreground">One Piece grind fuel</div>
            {/* equalizer */}
            <div className="mt-2 flex h-4 items-end gap-[3px]" aria-hidden>
              {[0.9, 0.5, 1, 0.65, 0.8].map((peak, index) => (
                <motion.span
                  key={index}
                  className="w-[3px] rounded-full bg-gradient-to-t from-violet-500 to-cyan-400"
                  animate={
                    playing
                      ? { height: [3, peak * 16, 5, peak * 12, 3] }
                      : { height: 3 }
                  }
                  transition={
                    playing
                      ? { duration: 0.9 + index * 0.13, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.2 }
                  }
                />
              ))}
            </div>
          </div>
          <Button
            size="icon"
            onClick={toggle}
            className="h-12 w-12 rounded-full"
            aria-label={playing ? "Pause anthem" : "Play anthem"}
          >
            {playing ? <Pause className="!size-5" /> : <Play className="ml-0.5 !size-5" />}
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          The King of the Pirates didn't quit when the sea pushed back. Neither do you.
        </p>

        {loaded && (
          <iframe
            ref={iframeRef}
            className="pointer-events-none absolute h-px w-px opacity-0"
            src={`${EMBED_ORIGIN}/embed/${VIDEO_ID}?autoplay=1&enablejsapi=1&loop=1&playlist=${VIDEO_ID}`}
            title="Hype anthem audio"
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            aria-hidden
          />
        )}
      </CardContent>
    </Card>
  );
}
