/** Pure swipe-gesture helpers: no React, no DOM — fully unit-testable. */

export type SwipeDir = "left" | "right";

export interface SwipePoint {
  x: number;
  y: number;
  /** Timestamp (ms) of the observation. */
  t: number;
}

export const SWIPE_MIN_PX = 60;
export const SWIPE_MAX_MS = 800;
/** Horizontal displacement must dominate vertical by this factor. */
export const SWIPE_DOMINANCE = 1.5;
/** Vertical drift (px) after which a gesture is treated as a scroll. */
export const SCROLL_LOCK_PX = 24;

/**
 * Classifies a completed touch gesture as a horizontal swipe.
 * Returns "left" for swipe-to-next, "right" for swipe-to-previous, null otherwise.
 */
export function classifySwipe(start: SwipePoint, end: SwipePoint): SwipeDir | null {
  const dt = end.t - start.t;
  if (dt < 0 || dt > SWIPE_MAX_MS) return null;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < SWIPE_MIN_PX) return null;
  if (Math.abs(dx) < Math.abs(dy) * SWIPE_DOMINANCE) return null;
  return dx < 0 ? "left" : "right";
}

/**
 * True once a move is clearly vertical (scrolling), so navigation is abandoned
 * even if the finger later drifts sideways.
 */
export function isVerticalScroll(start: SwipePoint, current: SwipePoint): boolean {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  return Math.abs(dy) > SCROLL_LOCK_PX && Math.abs(dy) > Math.abs(dx);
}

/** Interactive elements a swipe must never start on or hijack. */
const INTERACTIVE_SELECTOR = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "option",
  "label",
  "[role='switch']",
  "[role='slider']",
  "[role='tab']",
  "[contenteditable='true']",
  "[data-no-swipe]",
].join(",");

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null;
}
