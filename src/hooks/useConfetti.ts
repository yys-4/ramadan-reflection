import { useCallback, useRef } from "react";
import confetti from "canvas-confetti";

/**
 * Gamification feedback — fires confetti on achievements and point milestones.
 *
 * Design rationale: visual celebrations create dopamine-driven reinforcement loops
 * that encourage consistency (a core Ramadan goal). The teal/purple/gold/green
 * colors match the app's palette so the effect feels integrated, not jarring.
 */
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

  /**
   * Detects when the user crosses a 100-point milestone (100, 200, 300…).
   *
   * Uses floor division to find the current milestone tier, then compares
   * against the last celebrated milestone to avoid duplicate celebrations
   * when points fluctuate (e.g., unchecking then re-checking a habit).
   */
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
