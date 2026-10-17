import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Route } from "@/routes/index";

/**
 * Regression test for the exact-alarm flow (reminder delays): renders the real
 * app with Capacitor plugins mocked as native. Verifies: denied state shows
 * the enable button → clicking it opens system settings (mock grants) → on app
 * resume the status updates and active reminders are recreated.
 */

const h = vi.hoisted(() => ({
  listeners: [] as { evt: string; cb: (data: unknown) => void }[],
  exactAlarm: "denied",
  scheduled: [] as number[],
  cancelled: [] as number[],
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => "android" },
  registerPlugin: () => ({ open: async () => {} }),
}));

vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    // Mirrors the web implementation: always resolves { value } (null when absent).
    get: async ({ key }: { key: string }) => ({
      value: (globalThis as { localStorage?: Storage }).localStorage?.getItem(key) ?? null,
    }),
    set: async ({ key, value }: { key: string; value: string }) => {
      (globalThis as { localStorage?: Storage }).localStorage?.setItem(key, value);
    },
  },
}));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    createChannel: async () => {},
    checkPermissions: async () => ({ display: "granted" }),
    requestPermissions: async () => ({ display: "granted" }),
    schedule: async ({ notifications }: { notifications: { id: number }[] }) => {
      h.scheduled.push(...notifications.map((n) => n.id));
    },
    cancel: async ({ notifications }: { notifications: { id: number }[] }) => {
      h.cancelled.push(...notifications.map((n) => n.id));
    },
    checkExactNotificationSetting: async () => ({ exact_alarm: h.exactAlarm }),
    changeExactNotificationSetting: async () => {
      // The user grants «Будильники и напоминания» in the system screen.
      h.exactAlarm = "granted";
      return { exact_alarm: h.exactAlarm };
    },
  },
}));

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: async (evt: string, cb: (data: unknown) => void) => {
      h.listeners.push({ evt, cb });
      return { remove: () => {} };
    },
    exitApp: () => {},
  },
}));

vi.mock("@capacitor/status-bar", () => ({
  StatusBar: { setStyle: async () => {}, setBackgroundColor: async () => {} },
  Style: { Light: "LIGHT", Dark: "DARK" },
}));

const HabitsApp = Route.options.component as unknown as ComponentType;

const habit = (id: string, base: number) => ({
  id,
  title: `Зарядка ${id}`,
  description: "",
  reminderTime: "08:00",
  startDate: "2026-10-01",
  endDate: null,
  remindersEnabled: true,
  notificationId: base,
  scheduledIds: [base],
  status: "active",
  archivedReason: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
});

function renderApp() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <HabitsApp />
    </QueryClientProvider>,
  );
}

describe("Exact alarm permission flow", () => {
  beforeEach(() => {
    localStorage.clear();
    h.listeners.length = 0;
    h.exactAlarm = "denied";
    h.scheduled.length = 0;
    h.cancelled.length = 0;
    localStorage.setItem(
      "myhabits.habits.v1",
      JSON.stringify([habit("a1", 111), habit("a2", 222)]),
    );
    localStorage.setItem(
      "myhabits.settings.v1",
      JSON.stringify({
        theme: "system",
        notificationPermission: "granted",
        exactAlarmPermission: "denied",
        seeded: true,
      }),
    );
  });

  it("shows denied state, then after grant + resume updates status and recreates reminders", async () => {
    renderApp();
    await waitFor(() => expect(screen.queryByText("Загрузка…")).not.toBeInTheDocument());

    // Settings tab: exact alarm section shows «Запрещены» and the enable button.
    await act(async () => {
      screen.getByRole("button", { name: "Настройки" }).click();
    });
    const section = screen.getByRole("heading", { name: /Точные напоминания/ }).closest("section");
    expect(section).toHaveTextContent("Запрещены");
    const enable = screen.getByRole("button", {
      name: "Включить точные напоминания",
    });
    expect(enable).toBeInTheDocument();

    // User taps the button: system settings open (mock grants the permission).
    await act(async () => {
      enable.click();
    });
    expect(h.exactAlarm).toBe("granted");

    // Baseline: initial load itself replans reminders — record then clear,
    // so the assertions below prove the RESUME path reschedules.
    await waitFor(() => expect(h.cancelled).toEqual(expect.arrayContaining([111, 222])));
    h.cancelled.length = 0;
    h.scheduled.length = 0;

    // User returns to the app: appStateChange(isActive: true) fires.
    const stateListener = h.listeners.find((l) => l.evt === "appStateChange");
    expect(stateListener).toBeDefined();
    await act(async () => {
      stateListener!.cb({ isActive: true });
    });

    // Status updated and reminders recreated (old ids cancelled, new scheduled).
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Точные напоминания/ }).closest("section"),
      ).toHaveTextContent("Разрешены"),
    );
    expect(h.cancelled).toEqual(expect.arrayContaining([111, 222]));
    expect(h.scheduled.length).toBeGreaterThan(0);
    // Persisted state remembers the grant.
    expect(
      JSON.parse(localStorage.getItem("myhabits.settings.v1") ?? "{}").exactAlarmPermission,
    ).toBe("granted");
  });

  it("does not touch reminders when the permission did not change", async () => {
    renderApp();
    await waitFor(() => expect(screen.queryByText("Загрузка…")).not.toBeInTheDocument());

    const before = h.scheduled.length;
    const stateListener = h.listeners.find((l) => l.evt === "appStateChange");
    await act(async () => {
      stateListener!.cb({ isActive: true }); // still denied
    });
    await act(async () => {
      stateListener!.cb({ isActive: false }); // backgrounding is ignored
    });
    expect(h.scheduled.length).toBe(before);
  });
});
