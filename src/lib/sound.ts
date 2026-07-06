/**
 * Tiny WebAudio synth so the app ships zero audio assets.
 * All playback is gated by the sound setting via `setSoundEnabled`.
 */
let enabled = true;
let ctx: AudioContext | null = null;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(frequency: number, start: number, duration: number, volume = 0.08) {
  const audio = audioContext();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, audio.currentTime + start);
  gain.gain.linearRampToValueAtTime(volume, audio.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(audio.currentTime + start);
  osc.stop(audio.currentTime + start + duration + 0.05);
}

export function playTick() {
  if (!enabled) return;
  tone(880, 0, 0.08, 0.04);
}

export function playComplete() {
  if (!enabled) return;
  tone(523.25, 0, 0.18);
  tone(659.25, 0.14, 0.18);
  tone(783.99, 0.28, 0.3);
}

export function playAchievement() {
  if (!enabled) return;
  tone(659.25, 0, 0.14);
  tone(783.99, 0.1, 0.14);
  tone(1046.5, 0.2, 0.32, 0.1);
}
