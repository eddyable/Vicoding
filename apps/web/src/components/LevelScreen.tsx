import {
  buildBeats,
  nodeOwners,
  run,
  staminaFor,
  validate,
  valuesEqual,
  type Beat,
  type Inputs,
  type NodeId,
  type Program,
  type RunResult,
} from "@vicoding/engine";
import { charge, findDivergence, HARD_CAP_MULTIPLIER, type ChargeCase, type ChargeReport, type LevelModule } from "@vicoding/levels";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildFrame } from "../game/frame.ts";
import { measureGrowth, type GrowthPoint } from "../game/growth.ts";
import { formatValue } from "../game/narrate.ts";
import { Board } from "./Board.tsx";
import { ChargePanel } from "./ChargePanel.tsx";
import { CodePanel } from "./CodePanel.tsx";
import { HandMode } from "./HandMode.tsx";
import { PlanEditor } from "./PlanEditor.tsx";
import { ScoutCard } from "./ScoutCard.tsx";
import { SPEEDS, Timeline } from "./Timeline.tsx";

/** Events recorded for animation; longer runs are still scored, just not fully animated. */
const MAX_ANIMATED_EVENTS = 20_000;

interface RunState {
  input: Inputs;
  result: RunResult;
  beats: Beat[];
  owners: Map<NodeId, NodeId>;
}

function usePlanHistory(initial: Program) {
  const [history, setHistory] = useState({ past: [] as Program[], present: initial, future: [] as Program[] });
  return {
    program: history.present,
    set: (next: Program) => setHistory((h) => ({ past: [...h.past.slice(-49), h.present], present: next, future: [] })),
    undo: () =>
      setHistory((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past.at(-1)!, future: [h.present, ...h.future] } : h)),
    redo: () =>
      setHistory((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0]!, future: h.future.slice(1) } : h)),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset: (program: Program) => setHistory({ past: [], present: program, future: [] }),
  };
}

interface LevelScreenProps {
  level: LevelModule;
  savedPlan: Program | undefined;
  stars: number;
  hasNext: boolean;
  onPlanChange: (plan: Program) => void;
  onComplete: (stars: 1 | 2 | 3) => void;
  onNext: () => void;
  onExit: () => void;
}

export function LevelScreen({ level, savedPlan, stars, hasNext, onPlanChange, onComplete, onNext, onExit }: LevelScreenProps) {
  const def = level.definition;
  const readOnly = def.step === "watch";
  const starter = def.starterPlan ?? { body: [] };
  const plan = usePlanHistory(readOnly ? starter : (savedPlan ?? starter));
  const program = plan.program;

  const [examples, setExamples] = useState(() => def.examples.map((e, i) => ({ label: e.label ?? `Example ${i + 1}`, input: e.input })));
  const [exampleIndex, setExampleIndex] = useState(0);
  const [runState, setRunState] = useState<RunState | null>(null);
  const [stale, setStale] = useState(false);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [report, setReport] = useState<ChargeReport | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [foresight, setForesight] = useState<number | null>(null);
  const [growth, setGrowth] = useState<GrowthPoint[] | null>(null);
  /** Timeline position where the last replayed failure went wrong. */
  const [divergenceAt, setDivergenceAt] = useState<number | null>(null);
  /** Card picked by tapping a code line (highlighted when no run is shown). */
  const [selectedCard, setSelectedCard] = useState<NodeId | undefined>(undefined);
  const [handActive, setHandActive] = useState(() => def.handMode && !(savedPlan && savedPlan.body.length > 0));

  const context = useMemo(
    () => ({
      arrays: def.inputs.filter((i) => i.type !== "number").map((i) => i.name),
      scalars: def.inputs.filter((i) => i.type === "number").map((i) => i.name),
    }),
    [def],
  );
  const issues = useMemo(() => validate(program, context), [program, context]);
  const issueNodes = useMemo(() => new Set(showIssues ? issues.map((i) => i.node) : []), [issues, showIssues]);

  const changePlan = (next: Program) => {
    plan.set(next);
    onPlanChange(next);
    setStale(runState !== null);
    setShowIssues(false);
  };

  const activeInput = examples[exampleIndex]?.input ?? {};
  const length = runState?.beats.length ?? 0;
  const frame = useMemo(
    () => (runState ? buildFrame(runState.input, runState.result.events, runState.beats, position) : buildFrame(activeInput, [], [], 0)),
    [runState, position, activeInput],
  );
  const n = Object.values(runState?.input ?? activeInput).find(Array.isArray)?.length ?? 0;
  const budget = staminaFor(def.targets.stamina, n);

  /** Moves the timeline to the step where the run went wrong, if it did. Returns true if it moved. */
  const jumpToDivergence = useCallback(
    (state: RunState): boolean => {
      const at = findDivergence(level, state.input, state.result);
      const beat = at === undefined ? -1 : state.beats.findIndex((b) => b.start <= at && at <= b.end);
      if (beat < 0) return false;
      setPlaying(false);
      setPosition(beat + 1);
      setDivergenceAt(beat + 1);
      return true;
    },
    [level],
  );

  const startRun = useCallback(
    (input: Inputs, options: { toDivergence?: boolean } = {}) => {
      const result = run(program, input, { maxEvents: MAX_ANIMATED_EVENTS, maxTicks: budget * HARD_CAP_MULTIPLIER + 1_000 });
      const owners = nodeOwners(program);
      const state = { input, result, beats: buildBeats(result.events, owners), owners };
      setRunState(state);
      setStale(false);
      setDivergenceAt(null);
      setSelectedCard(undefined);
      if (options.toDivergence && jumpToDivergence(state)) return;
      setPosition(0);
      setPlaying(true);
    },
    [program, budget, jumpToDivergence],
  );

  const onRun = () => {
    if (issues.length > 0) {
      setShowIssues(true);
      return;
    }
    startRun(activeInput);
  };

  const onCharge = () => {
    if (issues.length > 0) {
      setShowIssues(true);
      return;
    }
    const result = charge(level, program);
    setGrowth(measureGrowth(level, program));
    setReport(result);
    if (result.stars > 0) onComplete(result.stars as 1 | 2 | 3);
  };

  const onReplay = (failure: ChargeCase) => {
    const key = JSON.stringify(failure.input);
    const existing = examples.findIndex((e) => JSON.stringify(e.input) === key);
    if (existing >= 0) {
      setExampleIndex(existing);
    } else {
      setExamples((list) => [...list, { label: failure.label, input: failure.input }]);
      setExampleIndex(examples.length);
    }
    setReport(null);
    startRun(failure.input, { toDivergence: true });
  };

  const selectCard = (node: NodeId) => {
    setSelectedCard(node);
    document.querySelector(`[data-card="${node}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const finishHandMode = (useDraft: boolean) => {
    setHandActive(false);
    if (useDraft && def.handDraft && program.body.length === 0) {
      changePlan(def.handDraft);
      setShowIssues(true);
    }
  };

  // Autoplay: advance one beat per tick of the chosen speed.
  useEffect(() => {
    if (!playing) return;
    if (position >= length) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setPosition((p) => p + 1), SPEEDS[speed]!.ms);
    return () => window.clearTimeout(timer);
  }, [playing, position, length, speed]);

  const atEnd = runState !== null && position >= length;
  const fault = atEnd ? runState.result.outcome.kind === "error" ? runState.result.outcome.fault : undefined : undefined;
  const highlightedCard = runState && !stale ? frame.activeCard : selectedCard;
  const errorNodes = useMemo(
    () => new Set(fault && runState ? [fault.node, runState.owners.get(fault.node) ?? fault.node] : []),
    [fault, runState],
  );

  return (
    <div className="level">
      <header className="level-header">
        <button type="button" className="link" onClick={onExit}>
          ← Map
        </button>
        <h1>
          <span className="level-number">{def.order}</span> {def.title}
        </h1>
        <span className="stars small" aria-label={`Best: ${stars} stars`}>
          {[1, 2, 3].map((s) => (
            <span key={s} className={s <= stars ? "star on" : "star"}>
              ★
            </span>
          ))}
        </span>
      </header>

      <div className="level-layout">
        <div className="col-board">
          <ScoutCard
            level={def}
            examples={examples}
            activeExample={exampleIndex}
            onSelectExample={(i) => {
              setExampleIndex(i);
              setRunState(null);
              setPlaying(false);
            }}
          />

          {def.foresight && (
            <section className="foresight" aria-label="Predict first">
              <div className="picker-title">🔮 Predict first</div>
              <p>{def.foresight.question}</p>
              <div className="council-options">
                {def.foresight.options.map((option, i) => (
                  <button
                    key={option}
                    type="button"
                    className={`option ${foresight === null ? "" : i === def.foresight!.answer ? "correct" : i === foresight ? "wrong" : ""}`}
                    onClick={() => foresight === null && setForesight(i)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {foresight !== null && <p className="explanation">{def.foresight.explanation} Now press Run and watch it happen.</p>}
            </section>
          )}

          {handActive ? (
            <HandMode level={level} input={activeInput} onDone={finishHandMode} />
          ) : (
            <>
          <Board frame={frame} inputs={def.inputs} />
          <Timeline
            position={position}
            length={length}
            playing={playing}
            speed={speed}
            ticks={frame.state.tick}
            budget={budget}
            onSeek={(p) => {
              setPlaying(false);
              setPosition(Math.max(0, Math.min(length, p)));
            }}
            onPlayPause={() => {
              if (position >= length) setPosition(0);
              setPlaying(!playing);
            }}
            onSpeed={setSpeed}
          />
          <p className="caption" aria-live="polite">
            {frame.caption}
          </p>
          {divergenceAt !== null && position === divergenceAt && (
            <div className="divergence" role="status">
              ⚡ <strong>Here the Jester's trap sprang:</strong> this step left the answer wrong. Step back ◀ to see how the plan got here.
              {runState && def.output.kind === "array" && (
                <div className="divergence-expected">
                  It should end as <code>{formatValue(level.reference(runState.input))}</code>
                </div>
              )}
            </div>
          )}
          {atEnd && runState && (
            <RunVerdict level={level} runState={runState} onJump={() => jumpToDivergence(runState)} />
          )}
          {runState?.result.truncated && <p className="note">This run is long, so only its first part is animated.</p>}
            </>
          )}
        </div>

        <div className="col-plan">
          <div className="plan-toolbar">
            {!readOnly && (
              <>
                <button type="button" onClick={plan.undo} disabled={!plan.canUndo} aria-label="Undo" title="Undo">
                  ↶
                </button>
                <button type="button" onClick={plan.redo} disabled={!plan.canRedo} aria-label="Redo" title="Redo">
                  ↷
                </button>
              </>
            )}
            <span className="spacer" />
            <button type="button" className="run" onClick={onRun}>
              ▶ Run
            </button>
            <button type="button" className="primary" onClick={onCharge}>
              ⚔ Charge!
            </button>
          </div>
          {stale && <p className="note">You changed the plan. Run it again to see the new battle.</p>}
          {showIssues && issues.length > 0 && (
            <div className="issues" role="alert">
              {issues.length === 1 ? "One thing to fix before running:" : `${issues.length} things to fix before running:`}
              <ul>
                {issues.slice(0, 4).map((issue) => (
                  <li key={issue.node + issue.code}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}
          <PlanEditor
            program={program}
            onChange={changePlan}
            level={def}
            readOnly={readOnly}
            activeCard={highlightedCard}
            errorNodes={errorNodes}
            issueNodes={issueNodes}
          />
          {readOnly && <p className="note">This plan is fixed: watch it, predict it, then Charge to complete the level.</p>}
          {def.codeVisibility === "live" && (
            <CodePanel program={program} level={def} activeCard={highlightedCard} onSelectCard={selectCard} title="Your plan, live as code" />
          )}
        </div>
      </div>

      {report && (
        <ChargePanel
          report={report}
          level={def}
          program={program}
          growth={growth}
          hasNext={hasNext}
          onReplay={onReplay}
          onNext={onNext}
          onClose={() => setReport(null)}
        />
      )}
    </div>
  );
}

function RunVerdict({ level, runState, onJump }: { level: LevelModule; runState: RunState; onJump: () => void }) {
  const { outcome } = runState.result;
  const expected = level.reference(runState.input);
  const output = level.definition.output;
  if (outcome.kind === "error") {
    return <div className="verdict fail">✘ {outcome.fault.message}</div>;
  }
  const actual = output.kind === "return" ? (outcome.kind === "returned" ? outcome.value : undefined) : runState.result.finalArrays[output.name];
  if (actual === undefined) {
    return <div className="verdict fail">✘ The plan ended without a Victory card. Expected {formatValue(expected)}.</div>;
  }
  const passed = level.accepts ? level.accepts(runState.input, actual) : valuesEqual(actual, expected);
  return passed ? (
    <div className="verdict pass">✔ Correct for this example: {formatValue(actual)}. Press Charge! to face the hidden waves.</div>
  ) : (
    <div className="verdict fail">
      ✘ Expected {formatValue(expected)}, but got {formatValue(actual)}.{" "}
      {output.kind === "array" && (
        <button type="button" className="link" onClick={onJump}>
          ⚡ Show me where it went wrong
        </button>
      )}
    </div>
  );
}
