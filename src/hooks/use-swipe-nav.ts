import { useCallback, useRef, type TouchEvent } from "react";
import { classifySwipe, isInteractiveTarget, isVerticalScroll, type SwipeDir } from "@/lib/swipe";

/**
 * Touch handlers for horizontal swipe navigation. Attach to a content container:
 * `const swipe = useSwipeNav(cb, enabled); ... <main {...swipe} />`.
 *
 * Safeguards: disabled via `enabled` (loading, open sheets/dialogs), single-touch
 * only, ignores gestures starting on interactive controls, and abandons the
 * gesture as soon as it is clearly a vertical scroll. Never preventDefault, so
 * ordinary scrolling and zoom keep working.
 */
export function useSwipeNav(onSwipe: (dir: SwipeDir) => void, enabled: boolean) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = useRef(0);
  const lockedRef = useRef(false);
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  const reset = () => {
    startRef.current = null;
    lockedRef.current = false;
  };

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return reset();
      if (e.touches.length > 1 || isInteractiveTarget(e.target)) {
        reset();
        lockedRef.current = true; // multitouch or interactive target: ignore until touchend
        return;
      }
      reset();
      const t = e.touches[0];
      if (!t) return;
      startRef.current = { x: t.clientX, y: t.clientY };
      startTimeRef.current = Date.now();
    },
    [enabled],
  );

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!startRef.current || lockedRef.current) return;
    if (e.touches.length > 1) {
      lockedRef.current = true;
      return;
    }
    const t = e.touches[0];
    if (!t || !startRef.current) return;
    if (
      isVerticalScroll(
        { x: startRef.current.x, y: startRef.current.y, t: startTimeRef.current },
        { x: t.clientX, y: t.clientY, t: Date.now() },
      )
    ) {
      lockedRef.current = true;
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const start = startRef.current;
      const wasLocked = lockedRef.current;
      reset();
      if (!start || wasLocked || !enabled) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dir = classifySwipe(
        { x: start.x, y: start.y, t: startTimeRef.current },
        { x: t.clientX, y: t.clientY, t: Date.now() },
      );
      if (dir) onSwipeRef.current(dir);
    },
    [enabled],
  );

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: reset };
}
