/**
 * Spaced repetition with Leitner boxes. Each puzzle sits in a box 0-4; a right
 * answer moves it up one box (reviewed later), a wrong one drops it to box 0
 * (reviewed again right away). The waits per box are fixed.
 */
export const DAY = 86_400_000;
export const INTERVALS = [0, DAY, 3 * DAY, 7 * DAY, 14 * DAY] as const;
export const TOP_BOX = INTERVALS.length - 1;

export interface CardState {
  box: number;
  /** Epoch ms when the puzzle is next due. */
  due: number;
  seen: number;
  misses: number;
}

export type Memory = Record<string, CardState>;

/** A puzzle never seen is due; a seen one is due once its wait is over. */
export function isDue(state: CardState | undefined, now: number): boolean {
  return state === undefined || state.due <= now;
}

export function review(state: CardState | undefined, correct: boolean, now: number): CardState {
  const box = state?.box ?? 0;
  const next = correct ? Math.min(box + 1, TOP_BOX) : 0;
  return {
    box: next,
    due: now + INTERVALS[next]!,
    seen: (state?.seen ?? 0) + 1,
    misses: (state?.misses ?? 0) + (correct ? 0 : 1),
  };
}

/**
 * The puzzles for one sitting: overdue ones first (longest overdue first),
 * then up to `size` in total filled with new ones in curriculum order.
 */
export function pickSession(ids: readonly string[], memory: Memory, now: number, size: number): string[] {
  const seen = ids
    .filter((id) => memory[id] !== undefined && isDue(memory[id], now))
    .sort((a, b) => memory[a]!.due - memory[b]!.due);
  const fresh = ids.filter((id) => memory[id] === undefined);
  return [...seen, ...fresh].slice(0, size);
}

export function dueCount(ids: readonly string[], memory: Memory, now: number): number {
  return ids.filter((id) => isDue(memory[id], now)).length;
}

/** When the next puzzle comes due, or undefined if something is due already or there are no puzzles. */
export function nextDueAt(ids: readonly string[], memory: Memory, now: number): number | undefined {
  if (dueCount(ids, memory, now) > 0) return undefined;
  const dues = ids.map((id) => memory[id]?.due).filter((d): d is number => d !== undefined);
  return dues.length > 0 ? Math.min(...dues) : undefined;
}

/** Share of the way to "known for good": the average box over all puzzles, 0 to 1. */
export function mastery(ids: readonly string[], memory: Memory): number {
  if (ids.length === 0) return 0;
  const total = ids.reduce((sum, id) => sum + (memory[id] && memory[id]!.seen > 0 ? memory[id]!.box : 0), 0);
  return total / (ids.length * TOP_BOX);
}

/** Reorders so neighbours differ in kind where possible (interleaving), keeping the order otherwise. */
export function interleave<T>(items: readonly T[], kindOf: (item: T) => string): T[] {
  const left = [...items];
  const out: T[] = [];
  while (left.length > 0) {
    const last = out.length > 0 ? kindOf(out[out.length - 1]!) : undefined;
    const at = Math.max(0, left.findIndex((item) => kindOf(item) !== last));
    out.push(left.splice(at, 1)[0]!);
  }
  return out;
}

/** "tomorrow", "in 3 days", "in 2 hours": for the end-of-session hint. */
export function describeWait(ms: number): string {
  if (ms < 60_000) return "right away";
  if (ms < 3_600_000) return `in ${Math.round(ms / 60_000)} min`;
  if (ms < DAY - 3_600_000) {
    const hours = Math.round(ms / 3_600_000);
    return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  const days = Math.round(ms / DAY);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}
