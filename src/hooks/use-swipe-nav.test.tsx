import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSwipeNav } from "./use-swipe-nav";
import type { SwipeDir } from "@/lib/swipe";

/** Minimal host: real DOM, real touch events, handlers wired like in <main>. */
function Host({ enabled, onSwipe }: { enabled: boolean; onSwipe: (d: SwipeDir) => void }) {
  const swipe = useSwipeNav(onSwipe, enabled);
  return (
    <main {...swipe} style={{ width: 320, height: 600 }}>
      <p data-testid="content">Контент</p>
      <button type="button">Кнопка</button>
    </main>
  );
}

/** jsdom Touch is incomplete; patch the few fields the handler reads. */
function touch(x: number, y: number) {
  return { clientX: x, clientY: y, identifier: 1 } as Touch;
}

async function swipeFrom(el: Element, x1: number, y1: number, x2: number, y2: number) {
  el.dispatchEvent(
    new TouchEvent("touchstart", { bubbles: true, cancelable: true, touches: [touch(x1, y1)] }),
  );
  el.dispatchEvent(
    new TouchEvent("touchmove", { bubbles: true, cancelable: true, touches: [touch(x2, y2)] }),
  );
  el.dispatchEvent(
    new TouchEvent("touchend", {
      bubbles: true,
      cancelable: true,
      changedTouches: [touch(x2, y2)],
      touches: [],
    }),
  );
}

describe("useSwipeNav wiring", () => {
  it("fires left and right swipes on real touch sequences", async () => {
    const onSwipe = vi.fn();
    render(<Host enabled onSwipe={onSwipe} />);
    const main = screen.getByRole("main");

    await swipeFrom(main, 300, 100, 160, 102);
    expect(onSwipe).toHaveBeenLastCalledWith("left");

    await swipeFrom(main, 160, 100, 300, 100);
    expect(onSwipe).toHaveBeenLastCalledWith("right");
    expect(onSwipe).toHaveBeenCalledTimes(2);
  });

  it("does not fire for a vertical scroll", async () => {
    const onSwipe = vi.fn();
    render(<Host enabled onSwipe={onSwipe} />);
    const main = screen.getByRole("main");

    await swipeFrom(main, 160, 100, 170, 300);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("does not fire when disabled", async () => {
    const onSwipe = vi.fn();
    render(<Host enabled={false} onSwipe={onSwipe} />);
    const main = screen.getByRole("main");

    await swipeFrom(main, 300, 100, 160, 100);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("ignores swipes starting on a button", async () => {
    const onSwipe = vi.fn();
    render(<Host enabled onSwipe={onSwipe} />);
    const button = screen.getByRole("button");

    await swipeFrom(button, 300, 20, 160, 20);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("touchcancel mid-gesture resets without firing", async () => {
    const onSwipe = vi.fn();
    render(<Host enabled onSwipe={onSwipe} />);
    const main = screen.getByRole("main");

    main.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [touch(300, 100)] }));
    main.dispatchEvent(new TouchEvent("touchmove", { bubbles: true, touches: [touch(220, 100)] }));
    main.dispatchEvent(new TouchEvent("touchcancel", { bubbles: true }));
    expect(onSwipe).not.toHaveBeenCalled();

    // After cancellation the container accepts a fresh swipe again.
    await swipeFrom(main, 300, 100, 160, 100);
    expect(onSwipe).toHaveBeenCalledTimes(1);
  });

  it("ignores a gesture that turned vertical mid-swipe (L-shape)", async () => {
    const onSwipe = vi.fn();
    render(<Host enabled onSwipe={onSwipe} />);
    const main = screen.getByRole("main");

    // Starts horizontal, goes clearly vertical (scroll), then drifts sideways.
    main.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [touch(300, 100)] }));
    main.dispatchEvent(new TouchEvent("touchmove", { bubbles: true, touches: [touch(295, 180)] }));
    main.dispatchEvent(
      new TouchEvent("touchend", {
        bubbles: true,
        changedTouches: [touch(100, 190)],
        touches: [],
      }),
    );
    // Final displacement would qualify as a left swipe, but the gesture was a scroll.
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("ignores multitouch gestures", async () => {
    const onSwipe = vi.fn();
    render(<Host enabled onSwipe={onSwipe} />);
    const main = screen.getByRole("main");

    main.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        touches: [touch(300, 100), touch(310, 400)],
      }),
    );
    main.dispatchEvent(
      new TouchEvent("touchend", {
        bubbles: true,
        changedTouches: [touch(160, 100)],
        touches: [],
      }),
    );
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("keeps ordinary taps inert", async () => {
    const onSwipe = vi.fn();
    render(<Host enabled onSwipe={onSwipe} />);
    const main = screen.getByRole("main");

    await swipeFrom(main, 160, 100, 175, 100);
    expect(onSwipe).not.toHaveBeenCalled();
  });
});
