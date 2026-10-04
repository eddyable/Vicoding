import { beforeEach, describe, expect, it } from "vitest";

/** Minimal in-memory localStorage for the Node test environment. */
function installStorage() {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

describe("analytics", () => {
  beforeEach(() => {
    installStorage();
  });

  it("records nothing until the player consents", async () => {
    const a = await import("../src/game/analytics.ts");
    a.track("level_start", { level: "x" });
    expect(a.readQueue()).toEqual([]);
    expect(a.getConsent()).toBe("unknown");
  });

  it("records events with an anonymous install id after consent", async () => {
    const a = await import("../src/game/analytics.ts");
    a.setConsent("granted");
    a.track("level_start", { level: "x" });
    a.track("plan_run", { level: "x", cards: 4 });
    const queue = a.readQueue();
    expect(queue.map((e) => e.name)).toEqual(["level_start", "plan_run"]);
    expect(queue[0]!.install).toBe(queue[1]!.install);
    expect(queue[0]!.install.length).toBeGreaterThan(8);
    expect(a.exportData().events).toHaveLength(2);
  });

  it("clears stored events when consent is withdrawn", async () => {
    const a = await import("../src/game/analytics.ts");
    a.setConsent("granted");
    a.track("level_start", {});
    a.setConsent("denied");
    a.track("level_start", {});
    expect(a.readQueue()).toEqual([]);
  });

  it("classifies devices by width and pointer", async () => {
    const { deviceType } = await import("../src/game/analytics.ts");
    expect(deviceType(390, true)).toBe("phone");
    expect(deviceType(820, true)).toBe("tablet");
    expect(deviceType(820, false)).toBe("desktop");
    expect(deviceType(1440, false)).toBe("desktop");
  });
});
