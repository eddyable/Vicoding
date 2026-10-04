import { validPalindrome as trial, type TrialCase } from "@vicoding/levels";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "../game/analytics.ts";
import { CodeEditor } from "./CodeEditor.tsx";
import { PythonRunner, type RunResult } from "./runner.ts";

export type TrialMode = "first" | "followup";

interface TransferTestProps {
  mode: TrialMode;
  /** Called when the player passes or gives up. */
  onFinish: (result: { passed: boolean; seconds: number; attempts: number; sawSolution: boolean }) => void;
  onExit: () => void;
}

const formatCase = (c: TrialCase) => `${trial.functionName}(${c.args.map((a) => JSON.stringify(a)).join(", ")})`;
const pyValue = (v: unknown) => (v === true ? "True" : v === false ? "False" : JSON.stringify(v));
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * The transfer test (FR-50..53): a fresh problem in plain Python. No cards and
 * no board, like a real interview. Python runs in the browser with Pyodide.
 */
export function TransferTest({ mode, onFinish, onExit }: TransferTestProps) {
  const runner = useMemo(() => new PythonRunner(), []);
  const [code, setCode] = useState(trial.starterCode);
  const [pythonState, setPythonState] = useState<"loading" | "ready" | "error">("loading");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const started = useRef(Date.now());

  useEffect(() => {
    track("transfer_test_start", { mode });
    runner.load().then(
      () => setPythonState("ready"),
      () => setPythonState("error"),
    );
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started.current) / 1000)), 1000);
    return () => {
      window.clearInterval(timer);
      runner.reset();
    };
  }, [runner, mode]);

  const softLimitReached = seconds >= trial.softLimitMinutes * 60;
  const passedCount = result?.outcomes.filter((o) => o.passed).length ?? 0;
  const allPassed = result !== null && !result.compileError && !result.timedOut && passedCount === trial.cases.length;
  const firstFailure = result?.outcomes.findIndex((o) => !o.passed) ?? -1;

  const submit = async () => {
    setRunning(true);
    const outcome = await runner.run(code, trial.functionName, trial.cases);
    const passed = !outcome.compileError && !outcome.timedOut && outcome.outcomes.every((o) => o.passed);
    setRunning(false);
    setResult(outcome);
    setAttempts((a) => a + 1);
    if (outcome.timedOut) {
      // The runner replaced its worker; show Python reloading until it's back.
      setPythonState("loading");
      runner.load().then(
        () => setPythonState("ready"),
        () => setPythonState("error"),
      );
    }
    track("transfer_test_submit", {
      mode,
      passed,
      cases_passed: outcome.outcomes.filter((o) => o.passed).length,
      cases_total: trial.cases.length,
      seconds: Math.floor((Date.now() - started.current) / 1000),
      attempt: attempts + 1,
      language: "python",
      timed_out: outcome.timedOut === true,
      compile_error: outcome.compileError !== undefined,
    });
  };

  const revealSolution = () => {
    setShowSolution(true);
    track("transfer_test_solution_shown", { mode, seconds });
  };

  return (
    <div className="trial">
      <header className="level-header">
        <button type="button" className="link" onClick={onExit}>
          ← Map
        </button>
        <h1>{mode === "first" ? "The Final Trial" : "The Trial, one day later"}</h1>
        <span className="trial-clock" aria-label={`Time: ${clock(seconds)}`}>
          ⏱ {clock(seconds)}
        </span>
      </header>

      <section className="trial-brief">
        <p className="mentor-line">
          {mode === "first"
            ? "No cards, no board, no pointers to drag. Just you and the code, like a real interview. You've done this pattern before: trust it."
            : "Welcome back. Same kind of problem, still no cards. Let's see what stuck."}
        </p>
        <h2>{trial.title}</h2>
        <p>{trial.statement}</p>
        {trial.examples.map((example) => (
          <pre key={formatCase(example)} className="trial-example">
            {formatCase(example)} → {pyValue(example.expected)}
          </pre>
        ))}
      </section>

      <section className="trial-editor" aria-label="Your Python solution">
        <div className="code-head">
          <strong>Python</strong>
          <span className="note">
            {pythonState === "loading" && "Loading Python (one time, about 10 MB)…"}
            {pythonState === "ready" && "Python is ready."}
            {pythonState === "error" && "Python couldn't load. Check your connection and reload the page."}
          </span>
        </div>
        <CodeEditor initial={trial.starterCode} onChange={setCode} label="Python code editor" />
        <div className="plan-toolbar">
          <span className="spacer" />
          <button type="button" className="primary" onClick={submit} disabled={pythonState !== "ready" || running}>
            {running ? "Running…" : "▶ Run the tests"}
          </button>
        </div>
      </section>

      {result && (
        <section className="trial-results" aria-label="Test results" aria-live="polite">
          {result.timedOut && <div className="verdict fail">✘ Your code ran for too long and was stopped. Is there a loop that never ends?</div>}
          {result.compileError && <div className="verdict fail">✘ {result.compileError}</div>}
          {!result.timedOut && !result.compileError && (
            <>
              <div className={`verdict ${allPassed ? "pass" : "fail"}`}>
                {allPassed ? "✔" : "✘"} {passedCount} of {trial.cases.length} tests passed
              </div>
              {firstFailure >= 0 && (
                <div className="trial-failure">
                  <div className="picker-title">First failing test</div>
                  <pre>{formatCase(trial.cases[firstFailure]!)}</pre>
                  <p>
                    Expected <code>{pyValue(trial.cases[firstFailure]!.expected)}</code>
                    {result.outcomes[firstFailure]!.error ? (
                      <>
                        , but it raised <code>{result.outcomes[firstFailure]!.error}</code>
                      </>
                    ) : (
                      <>
                        , but got <code>{result.outcomes[firstFailure]!.got}</code>
                      </>
                    )}
                  </p>
                  {result.outcomes[firstFailure]!.stdout && <pre className="trial-stdout">{result.outcomes[firstFailure]!.stdout}</pre>}
                </div>
              )}
            </>
          )}
          {allPassed && (
            <button type="button" className="primary" onClick={() => onFinish({ passed: true, seconds, attempts, sawSolution: false })}>
              Continue →
            </button>
          )}
        </section>
      )}

      {!allPassed && softLimitReached && !showSolution && (
        <section className="trial-help">
          <p>You've been at it for {trial.softLimitMinutes} minutes. That's fine: real interviews get stuck too.</p>
          <button type="button" onClick={revealSolution}>
            Show me a solution
          </button>
        </section>
      )}

      {showSolution && (
        <section className="trial-solution" aria-label="A solution">
          <div className="picker-title">A two-pointer solution</div>
          <pre className="code">{trial.solution}</pre>
          <p className="note">Notice the pattern: the Mirror Twins, walking in from both ends, skipping anything that isn't a letter or digit.</p>
          <button type="button" className="primary" onClick={() => onFinish({ passed: false, seconds, attempts, sawSolution: true })}>
            Continue →
          </button>
        </section>
      )}
    </div>
  );
}
