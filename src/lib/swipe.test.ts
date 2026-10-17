import { describe, expect, it } from "vitest";
import { classifySwipe, isInteractiveTarget, isVerticalScroll, type SwipePoint } from "./swipe";

const at = (x: number, y: number, t = 1000): SwipePoint => ({ x, y, t });

describe("classifySwipe", () => {
  it("recognises a fast left swipe", () => {
    expect(classifySwipe(at(300, 100), at(180, 102, 1200))).toBe("left");
  });
  it("recognises a fast right swipe", () => {
    expect(classifySwipe(at(180, 100), at(300, 98, 1200))).toBe("right");
  });
  it("ignores short gestures (tap or small drag)", () => {
    expect(classifySwipe(at(100, 100), at(130, 100, 1100))).toBeNull();
  });
  it("ignores slow gestures", () => {
    expect(classifySwipe(at(300, 100), at(150, 100, 3000))).toBeNull();
  });
  it("ignores time going backwards", () => {
    expect(classifySwipe(at(300, 100), at(150, 100, 500))).toBeNull();
  });
  it("ignores vertical-dominant movement", () => {
    expect(classifySwipe(at(300, 100), at(240, 200, 1200))).toBeNull();
  });
});

describe("isVerticalScroll", () => {
  it("locks once vertical drift dominates", () => {
    expect(isVerticalScroll(at(100, 100), at(110, 160))).toBe(true);
  });
  it("does not lock for mostly horizontal movement", () => {
    expect(isVerticalScroll(at(100, 100), at(200, 120))).toBe(false);
  });
  it("does not lock for tiny drift", () => {
    expect(isVerticalScroll(at(100, 100), at(105, 115))).toBe(false);
  });
});

describe("isInteractiveTarget", () => {
  it("detects buttons and inputs", () => {
    const button = document.createElement("button");
    expect(isInteractiveTarget(button)).toBe(true);
    const input = document.createElement("input");
    expect(isInteractiveTarget(input)).toBe(true);
    // A wrapper around a button is not interactive itself: closest() only looks up.
    const span = document.createElement("span");
    span.append(button);
    expect(isInteractiveTarget(span)).toBe(false);
  });
  it("allows plain content", () => {
    const p = document.createElement("p");
    expect(isInteractiveTarget(p)).toBe(false);
    expect(isInteractiveTarget(null)).toBe(false);
  });
});
