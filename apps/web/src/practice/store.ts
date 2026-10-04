import type { Memory } from "./schedule.ts";

const KEY = "vicoding:v0:practice";

export function loadMemory(): Memory {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Memory) : {};
  } catch {
    return {};
  }
}

export function saveMemory(memory: Memory): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Saving is a convenience; practice keeps working without it.
  }
}
