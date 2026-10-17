/** Tab order shared by the bottom navigation and swipe navigation. */

export const TAB_ORDER = ["habits", "archive", "settings"] as const;
export type Tab = (typeof TAB_ORDER)[number];

/**
 * Tab adjacent to `current` in the swipe direction:
 * "left" (next tab to the right) or "right" (previous tab), null at the edges.
 */
export function nextTab(current: Tab, dir: "left" | "right"): Tab | null {
  const i = TAB_ORDER.indexOf(current);
  if (i < 0) return null;
  const n = dir === "left" ? i + 1 : i - 1;
  return TAB_ORDER[n] ?? null;
}
