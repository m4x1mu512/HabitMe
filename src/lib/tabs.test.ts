import { describe, expect, it } from "vitest";
import { nextTab, TAB_ORDER, type Tab } from "./tabs";

describe("nextTab", () => {
  it("left swipe (to next tab) follows the displayed order", () => {
    expect(nextTab("habits", "left")).toBe("archive");
    expect(nextTab("archive", "left")).toBe("settings");
  });
  it("right swipe (to previous tab) reverses the order", () => {
    expect(nextTab("settings", "right")).toBe("archive");
    expect(nextTab("archive", "right")).toBe("habits");
  });
  it("clamps at the edges", () => {
    expect(nextTab("habits", "right")).toBeNull();
    expect(nextTab("settings", "left")).toBeNull();
  });
  it("tab order matches the bottom navigation", () => {
    expect(TAB_ORDER).toEqual(["habits", "archive", "settings"]);
  });
  it("returns null for an unknown tab", () => {
    expect(nextTab("unknown" as Tab, "left")).toBeNull();
  });
});
