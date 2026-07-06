import { motion } from "framer-motion";
import { Music4, Play } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VIDEO_ID = "l-2hOKIrIyI";

/**
 * Hype anthem player. The YouTube iframe is only mounted after the user
 * hits play — keeps the dashboard fast and lets autoplay start with sound.
 */
export function MusicCard() {
  const [playing, setPlaying] = useState(false);

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Music4 className="h-4 w-4 text-primary" />
          Hype Anthem
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/[0.06] bg-black/40">
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
              title="Hype anthem — Luffy mode"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-3"
              aria-label="Play hype anthem"
            >
              <img
                src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity group-hover:opacity-70"
                loading="lazy"
              />
              <motion.span
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 shadow-glow-violet"
              >
                <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
              </motion.span>
              <span className="relative text-xs font-medium text-white/90">
                Press play. Enter Luffy mode. 🏴‍☠️
              </span>
            </button>
          )}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          The King of the Pirates didn't quit when the sea pushed back. Neither do you.
        </p>
      </CardContent>
    </Card>
  );
}
