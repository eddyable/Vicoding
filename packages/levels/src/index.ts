import { tallestScroll } from "./arraia/01-tallest-scroll.ts";
import { mirrorTwins } from "./arraia/02-mirror-twins.ts";
import { impOnTheBridge } from "./arraia/03-imp-on-the-bridge.ts";
import type { LevelModule } from "./types.ts";

export * from "./types.ts";
export * from "./check.ts";
export * from "./charge.ts";
export * from "./random.ts";

/** All playable levels, in campaign order. */
export const levels: readonly LevelModule[] = [tallestScroll, mirrorTwins, impOnTheBridge];

export function getLevel(id: string): LevelModule | undefined {
  return levels.find((level) => level.definition.id === id);
}
