import { useCallback, useRef } from "react";
import confetti from "canvas-confetti";

export function useConfetti() {
  const lastMilestone = useRef(0);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#2db5a3", "#8b5cf6", "#f59e0b", "#10b981"],
    });
  }, []);

  const checkMilestone = useCallback(
    (totalPoints: number) => {
      const milestone = Math.floor(totalPoints / 100) * 100;
      if (milestone > 0 && milestone > lastMilestone.current) {
        lastMilestone.current = milestone;
        fireConfetti();
        return milestone;
      }
      return null;
    },
    [fireConfetti]
  );

  return { fireConfetti, checkMilestone };
}
