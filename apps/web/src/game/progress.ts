import type { Program } from "@vicoding/engine";

export interface LevelProgress {
  stars: 0 | 1 | 2 | 3;
  completed: boolean;
  /** The player's latest plan, restored when they come back. */
  plan?: Program;
}

export type Progress = Record<string, LevelProgress>;

const KEY = "vicoding:v0:progress";

/** Progress lives in browser storage; any failure (private mode, quota) degrades to no saving. */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Saving is a convenience; the game keeps working without it.
  }
}

export function isUnlocked(progress: Progress, orderedIds: readonly string[], id: string): boolean {
  const index = orderedIds.indexOf(id);
  if (index <= 0) return true;
  return progress[orderedIds[index - 1] as string]?.completed === true;
}
