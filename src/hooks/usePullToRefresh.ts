import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Mobile-native pull-to-refresh gesture handler.
 *
 * Mimics the iOS/Android native pull-to-refresh pattern so the PWA feels like
 * a real app rather than a web page. Essential for the Ramadan use case where
 * users often refresh after returning from prayer to see updated streaks.
 *
 * The 0.5x dampening factor on touch movement creates a rubber-band feel —
 * pulling 160px of finger movement only shows 80px of indicator, which matches
 * iOS's native elastic scrolling behavior and prevents the indicator from
 * feeling "too easy" to trigger accidentally.
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Threshold in pixels before a refresh is triggered — 80px is high enough
  // to avoid accidental triggers during normal scrolling, but low enough to
  // feel responsive on small phone screens.
  const threshold = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only capture pull gestures when already scrolled to the top
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY.current === 0 || isRefreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && window.scrollY === 0) {
      // Apply 0.5x dampening and cap at 120px to prevent excessive stretching
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startY.current = 0;
  }, [pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef, isRefreshing, pullDistance, threshold };
}
