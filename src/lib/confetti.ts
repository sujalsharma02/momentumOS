import confetti from "canvas-confetti";

export function celebrate() {
  const colors = ["#8b5cf6", "#22d3ee", "#34d399", "#f472b6"];
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { x: 0.2, y: 0.7 },
    colors,
  });
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { x: 0.8, y: 0.7 },
    colors,
  });
  window.setTimeout(() => {
    confetti({ particleCount: 120, spread: 120, origin: { x: 0.5, y: 0.5 }, colors });
  }, 350);
}
