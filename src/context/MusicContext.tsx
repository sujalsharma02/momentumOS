import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const EMBED_ORIGIN = "https://www.youtube-nocookie.com";
const STORAGE_KEY = "momentum-os:station";

export const STATIONS = [
  { id: "jfKfPfyJRdk", title: "lofi hip hop radio", sub: "beats to relax/study to" },
  { id: "4xDzrJKXOOY", title: "synthwave radio", sub: "beats to chill/game to" },
  { id: "Dx5qFachd3A", title: "jazz lofi radio", sub: "beats to chill/study to" },
  { id: "l-2hOKIrIyI", title: "Luffy Mode", sub: "One Piece grind fuel" },
];

interface MusicContextValue {
  station: (typeof STATIONS)[number];
  playing: boolean;
  toggle: () => void;
  setStation: (id: string) => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

/**
 * Audio-only YouTube player mounted once at app level, so it keeps playing
 * across route changes. The iframe is created on first play (user activation
 * allows sound) and driven through the IFrame postMessage API.
 */
export function MusicProvider({ children }: { children: ReactNode }) {
  const [stationId, setStationId] = useState(() => localStorage.getItem(STORAGE_KEY) ?? STATIONS[0].id);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, stationId);
  }, [stationId]);

  const send = (func: "playVideo" | "pauseVideo") =>
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), EMBED_ORIGIN);

  const toggle = useCallback(() => {
    if (!loaded) {
      setLoaded(true);
      setPlaying(true);
      return;
    }
    send(playing ? "pauseVideo" : "playVideo");
    setPlaying((v) => !v);
  }, [loaded, playing]);

  const setStation = useCallback((id: string) => {
    setStationId(id);
    setLoaded(false);
    setPlaying(false);
  }, []);

  const value = useMemo(
    () => ({
      station: STATIONS.find((s) => s.id === stationId) ?? STATIONS[0],
      playing,
      toggle,
      setStation,
    }),
    [stationId, playing, toggle, setStation],
  );

  return (
    <MusicContext.Provider value={value}>
      {children}
      {loaded && (
        <iframe
          key={stationId}
          ref={iframeRef}
          className="pointer-events-none fixed h-px w-px opacity-0"
          src={`${EMBED_ORIGIN}/embed/${stationId}?autoplay=1&enablejsapi=1&loop=1&playlist=${stationId}`}
          title="Focus audio"
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          aria-hidden
        />
      )}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
}
