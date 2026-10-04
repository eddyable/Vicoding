/// <reference lib="webworker" />
import { loadPyodide, type PyodideInterface } from "pyodide";

/**
 * Runs the player's Python in Pyodide, off the main thread. The page can
 * terminate this worker if a run takes too long (e.g. an infinite loop).
 */

export interface RunRequest {
  id: number;
  code: string;
  functionName: string;
  cases: { args: unknown[]; expected: unknown }[];
}

export interface CaseOutcome {
  passed: boolean;
  /** Python repr of the returned value. */
  got?: string;
  error?: string;
  stdout: string;
}

export type WorkerMessage =
  | { type: "ready" }
  | { type: "load-error"; message: string }
  | { type: "result"; id: number; compileError?: string; outcomes: CaseOutcome[] };

const HARNESS = `
import json, io, contextlib, traceback

def _vicoding_run(code, function_name, cases_json):
    namespace = {}
    try:
        exec(compile(code, "solution.py", "exec"), namespace)
    except Exception as e:
        return json.dumps({"compileError": f"{type(e).__name__}: {e}", "outcomes": []})
    fn = namespace.get(function_name)
    if not callable(fn):
        return json.dumps({"compileError": f"Define a function called {function_name}(...)", "outcomes": []})
    outcomes = []
    for case in json.loads(cases_json):
        buffer = io.StringIO()
        try:
            with contextlib.redirect_stdout(buffer):
                got = fn(*case["args"])
            outcomes.append({"passed": got == case["expected"] and type(got) is type(case["expected"]), "got": repr(got), "stdout": buffer.getvalue()})
        except Exception as e:
            frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == "solution.py"]
            where = f" (line {frames[-1].lineno})" if frames else ""
            outcomes.append({"passed": False, "error": f"{type(e).__name__}: {e}{where}", "stdout": buffer.getvalue()})
    return json.dumps({"outcomes": outcomes})
`;

const scope = self as unknown as DedicatedWorkerGlobalScope;
let pyodide: PyodideInterface | undefined;

async function start(): Promise<void> {
  try {
    const indexURL = new URL(`${import.meta.env.BASE_URL}pyodide/`, scope.location.href).href;
    pyodide = await loadPyodide({ indexURL });
    pyodide.runPython(HARNESS);
    scope.postMessage({ type: "ready" } satisfies WorkerMessage);
  } catch (error) {
    scope.postMessage({ type: "load-error", message: String(error) } satisfies WorkerMessage);
  }
}

scope.onmessage = (event: MessageEvent<RunRequest>) => {
  const { id, code, functionName, cases } = event.data;
  if (!pyodide) return;
  const run = pyodide.globals.get("_vicoding_run") as (code: string, fn: string, cases: string) => string;
  const parsed = JSON.parse(run(code, functionName, JSON.stringify(cases))) as { compileError?: string; outcomes: CaseOutcome[] };
  scope.postMessage({ type: "result", id, ...parsed } satisfies WorkerMessage);
};

void start();
