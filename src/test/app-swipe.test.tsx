import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";

import { Route } from "@/routes/index";

/**
 * Full-app integration: renders the real root screen (web mode, storage mocked
 * in localStorage by @capacitor/preferences) and drives real touch sequences.
 */
const HabitsApp = Route.options.component as unknown as ComponentType;

function touch(x: number, y: number) {
  return { clientX: x, clientY: y, identifier: 1 } as Touch;
}

function swipe(el: Element, x1: number, y1: number, x2: number, y2: number) {
  // Raw dispatchEvent is invisible to React act() — wrap so updates flush before assertions.
  act(() => {
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
  });
}

function renderApp() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <HabitsApp />
    </QueryClientProvider>,
  );
}

describe("App swipe navigation (integration)", () => {
  it("swipe left switches to Archive and marks the nav item", async () => {
    renderApp();
    await waitFor(() => expect(screen.queryByText("Загрузка…")).not.toBeInTheDocument());
    const main = screen.getByRole("main");

    swipe(main, 300, 150, 150, 150);

    expect(screen.getByRole("heading", { name: "Архив" })).toBeInTheDocument();
    const archive = screen.getByRole("button", { name: "Архив" });
    expect(archive).toHaveAttribute("aria-current", "page");
  });

  it("swipe right goes back and is clamped at the first tab", async () => {
    renderApp();
    await waitFor(() => expect(screen.queryByText("Загрузка…")).not.toBeInTheDocument());
    const main = screen.getByRole("main");

    // Right swipe on the first tab: nothing to switch to, stays on Привычки.
    swipe(main, 150, 150, 300, 150);
    expect(screen.getByRole("heading", { name: "Мои привычки" })).toBeInTheDocument();

    // Left to Archive, then right back to habits.
    swipe(main, 300, 150, 150, 150);
    expect(screen.getByRole("heading", { name: "Архив" })).toBeInTheDocument();
    swipe(main, 150, 150, 300, 150);
    expect(screen.getByRole("heading", { name: "Мои привычки" })).toBeInTheDocument();
  });

  it("swipe left twice reaches Settings", async () => {
    renderApp();
    await waitFor(() => expect(screen.queryByText("Загрузка…")).not.toBeInTheDocument());
    const main = screen.getByRole("main");

    swipe(main, 300, 150, 150, 150);
    swipe(main, 300, 150, 150, 150);
    expect(screen.getByRole("heading", { name: "Настройки" })).toBeInTheDocument();
  });
});
