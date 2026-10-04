import type { TrialCase } from "@vicoding/levels";
import type { CaseOutcome, WorkerMessage } from "./python.worker.ts";

export type { CaseOutcome };

export interface RunResult {
  compileError?: string;
  timedOut?: boolean;
  outcomes: CaseOutcome[];
}

/** A run that takes longer than this is stopped (it's almost always an infinite loop). */
export const RUN_TIMEOUT_MS = 8_000;

/**
 * Owns the Python worker: loads Pyodide once, runs submissions, and replaces
 * the worker when a run has to be stopped.
 */
export class PythonRunner {
  private worker: Worker | undefined;
  private ready: Promise<void> | undefined;
  private nextId = 1;

  /** Starts loading Python in the background; resolves when it can run code. */
  load(): Promise<void> {
    if (this.ready) return this.ready;
    const worker = new Worker(new URL("./python.worker.ts", import.meta.url), { type: "module" });
    this.worker = worker;
    this.ready = new Promise((resolve, reject) => {
      const onMessage = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.type === "ready") resolve();
        if (event.data.type === "load-error") reject(new Error(event.data.message));
        if (event.data.type !== "result") worker.removeEventListener("message", onMessage);
      };
      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", (e) => reject(new Error(e.message)));
    });
    this.ready.catch(() => this.reset());
    return this.ready;
  }

  async run(code: string, functionName: string, cases: TrialCase[]): Promise<RunResult> {
    await this.load();
    const worker = this.worker!;
    const id = this.nextId++;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        worker.removeEventListener("message", onMessage);
        this.reset();
        resolve({ timedOut: true, outcomes: [] });
      }, RUN_TIMEOUT_MS);
      const onMessage = (event: MessageEvent<WorkerMessage>) => {
        const data = event.data;
        if (data.type !== "result" || data.id !== id) return;
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
        resolve(data.compileError ? { compileError: data.compileError, outcomes: [] } : { outcomes: data.outcomes });
      };
      worker.addEventListener("message", onMessage);
      worker.postMessage({ id, code, functionName, cases });
    });
  }

  /** Kills the worker; the next run starts a fresh one (and reloads Python). */
  reset(): void {
    this.worker?.terminate();
    this.worker = undefined;
    this.ready = undefined;
  }
}
