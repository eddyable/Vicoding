import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { track } from "../game/analytics.ts";
import { buildFrame } from "../game/frame.ts";
import {
  BUGS,
  PUZZLE_IDS,
  WATCH_SHELVES,
  correctAnswer,
  flagBefore,
  flagMoves,
  foolingShelf,
  getPuzzle,
  traceOf,
  type BugPuzzle,
  type FinalPuzzle,
  type MovesPuzzle,
  type Puzzle,
  type TracePuzzle,
} from "../practice/puzzles.ts";
import { describeWait, interleave, mastery, pickSession, review, type Memory } from "../practice/schedule.ts";
import { makeShelfRun, type ShelfRun } from "../practice/shelfRun.ts";
import { loadMemory, saveMemory } from "../practice/store.ts";
import { ScrollBoard } from "./ScrollBoard.tsx";

const SESSION_SIZE = 5;
const STEP_MS = 600;

interface Entry {
  id: string;
  retry: boolean;
}

function planSession(memory: Memory): Entry[] {
  const ids = interleave(pickSession(PUZZLE_IDS, memory, Date.now(), SESSION_SIZE), (id) => getPuzzle(id)!.kind);
  return ids.map((id) => ({ id, retry: false }));
}

interface PracticeScreenProps {
  onExit: () => void;
}

/** A short sitting: watch the pattern run, then answer a few spaced, interleaved micro-puzzles. */
export function PracticeScreen({ onExit }: PracticeScreenProps) {
  const [memory, setMemory] = useState<Memory>(loadMemory);
  const [queue, setQueue] = useState<Entry[]>(() => planSession(memory));
  const [watchShelf] = useState(() => WATCH_SHELVES[Object.values(memory).reduce((n, c) => n + c.seen, 0) % WATCH_SHELVES.length]!);
  const [phase, setPhase] = useState<"watch" | "ask" | "summary">(queue.length > 0 ? "watch" : "summary");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  useEffect(() => {
    track("practice_start", { puzzles: queue.length });
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entry = queue[index];
  const puzzle = entry ? getPuzzle(entry.id) : undefined;

  const answer = (value: string) => {
    if (!entry || !puzzle || picked !== null) return;
    const correct = value === correctAnswer(puzzle);
    setPicked(value);
    setResults((r) => [...r, correct]);
    track("practice_answer", { puzzle: puzzle.id, kind: puzzle.kind, correct, retry: entry.retry, box: memory[puzzle.id]?.box ?? 0 });
    if (!entry.retry) {
      const next = { ...memory, [puzzle.id]: review(memory[puzzle.id], correct, Date.now()) };
      setMemory(next);
      saveMemory(next);
      if (!correct) setQueue((q) => [...q, { id: puzzle.id, retry: true }]);
    }
  };

  const next = () => {
    if (index + 1 >= queue.length) {
      track("practice_done", { correct: results.filter(Boolean).length, total: results.length });
      setPhase("summary");
    } else {
      setIndex(index + 1);
      setPicked(null);
    }
  };

  const again = () => {
    const fresh = planSession(memory);
    setQueue(fresh);
    setIndex(0);
    setPicked(null);
    setResults([]);
    setPhase(fresh.length > 0 ? "ask" : "summary");
  };

  return (
    <div className="practice">
      <header className="practice-head">
        <button type="button" className="icon" onClick={onExit} aria-label="Back to the map">
          ✕
        </button>
        <ol className="dots" aria-label={phase === "ask" ? `Puzzle ${index + 1} of ${queue.length}` : "Progress"}>
          {queue.map((q, i) => (
            <li
              key={`${q.id}-${i}`}
              className={`dot ${i < results.length ? (results[i] ? "ok" : "bad") : i === index && phase === "ask" ? "now" : ""} ${q.retry ? "retry" : ""}`}
            />
          ))}
        </ol>
      </header>

      {phase === "watch" && <Watch shelf={watchShelf} onDone={() => setPhase("ask")} />}

      {phase === "ask" && puzzle && entry && (
        <Question key={`${entry.id}-${index}`} puzzle={puzzle} retry={entry.retry} picked={picked} onAnswer={answer} onNext={next} last={index + 1 >= queue.length} />
      )}

      {phase === "summary" && <Summary results={results.filter((_, i) => !queue[i]?.retry)} memory={memory} onExit={onExit} onAgain={again} />}
    </div>
  );
}

function usePlayer(run: ShelfRun, from: number, to: number, playing: boolean) {
  const [position, setPosition] = useState(from);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setPosition((p) => Math.min(to, p + 1)), STEP_MS);
    return () => window.clearInterval(timer);
  }, [playing, to]);
  return buildFrame(run.inputs, run.events, run.beats, position);
}

function Watch({ shelf, onDone }: { shelf: number[]; onDone: () => void }) {
  const run = useMemo(() => makeShelfRun(shelf), [shelf]);
  const [replay, setReplay] = useState(0);
  return (
    <div className="practice-body">
      <WatchPlayer key={replay} run={run} shelf={shelf} />
      <div className="practice-actions">
        <button type="button" className="icon" onClick={() => setReplay((r) => r + 1)} aria-label="Watch again">
          ↻
        </button>
        <button type="button" className="primary big" onClick={onDone}>
          Ready ▶
        </button>
      </div>
    </div>
  );
}

function WatchPlayer({ run, shelf }: { run: ShelfRun; shelf: number[] }) {
  const frame = usePlayer(run, 0, run.length, true);
  return (
    <>
      <ScrollBoard frame={frame} array="scrolls" scalars={[]} />
      <p className="sr-only" role="status">
        {frame.caption} Shelf: {shelf.join(", ")}.
      </p>
    </>
  );
}

interface QuestionProps {
  puzzle: Puzzle;
  retry: boolean;
  picked: string | null;
  onAnswer: (value: string) => void;
  onNext: () => void;
  last: boolean;
}

function Question({ puzzle, retry, picked, onAnswer, onNext, last }: QuestionProps) {
  const correct = correctAnswer(puzzle);
  const done = picked !== null;
  const right = picked === correct;
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (done) nextRef.current?.focus();
  }, [done]);

  const choice = { picked, correct, onAnswer };
  return (
    <div className="practice-body">
      {retry && <p className="retry-tag">Once more</p>}
      {(puzzle.kind === "moves" || puzzle.kind === "final") && <ShelfQuestion puzzle={puzzle} {...choice} />}
      {puzzle.kind === "trace" && <TraceQuestion puzzle={puzzle} {...choice} />}
      {puzzle.kind === "bug" && <BugQuestion puzzle={puzzle} {...choice} />}

      {done && (
        <div className={`feedback ${right ? "right" : "wrong"}`} role="status">
          <span className="feedback-mark" aria-hidden>
            {right ? "✓" : "✕"}
          </span>
          <span className="feedback-text">
            <strong>{right ? "Yes!" : "Not quite."}</strong> {explain(puzzle)}
          </span>
          <button type="button" className="primary big" ref={nextRef} onClick={onNext}>
            {last ? "Finish" : "Next"} ▶
          </button>
        </div>
      )}
    </div>
  );
}

function explain(puzzle: Puzzle): string {
  switch (puzzle.kind) {
    case "moves": {
      const v = puzzle.shelf[puzzle.at] as number;
      const before = flagBefore(puzzle.shelf, puzzle.at);
      return flagMoves(puzzle.shelf, puzzle.at) ? `${v} is taller than ${before}, so the flag rises.` : `${v} is not taller than ${before}, so the flag stays.`;
    }
    case "final":
      return `The flag ends on the tallest: ${Math.max(...puzzle.shelf)}.`;
    case "trace":
      return "The flag only ever rises. It keeps the tallest seen so far.";
    case "bug": {
      const fool = puzzle.shelves[foolingShelf(puzzle)] as number[];
      return `This plan says ${BUGS[puzzle.bug].run(fool)}, but the tallest is ${Math.max(...fool)}.`;
    }
  }
}

interface ChoiceProps {
  picked: string | null;
  correct: string;
  onAnswer: (value: string) => void;
}

function ShelfQuestion({ puzzle, ...choice }: { puzzle: MovesPuzzle | FinalPuzzle } & ChoiceProps) {
  const run = useMemo(() => makeShelfRun(puzzle.shelf), [puzzle]);
  const from = run.arrivalAt(puzzle.kind === "moves" ? puzzle.at : 0) ?? 0;
  const to = puzzle.kind === "moves" ? run.leaveAt(puzzle.at) : run.length;
  const frame = usePlayer(run, from, to, choice.picked !== null);
  const values = puzzle.kind === "final" ? [...new Set(puzzle.shelf)].sort((a, b) => a - b) : [];
  return (
    <>
      <p className="ask">{puzzle.kind === "moves" ? "Does the flag move?" : "Where will the flag end?"}</p>
      <ScrollBoard frame={frame} array="scrolls" scalars={[]} />
      <div className="options row">
        {puzzle.kind === "moves" ? (
          <>
            <Option value="moves" label="Flag moves up" {...choice}>
              <span className="opt-icon">⬆</span>Moves
            </Option>
            <Option value="stays" label="Flag stays" {...choice}>
              <span className="opt-icon">⏸</span>Stays
            </Option>
          </>
        ) : (
          values.map((v) => (
            <Option key={v} value={String(v)} label={`Flag ends at ${v}`} {...choice}>
              <span className="opt-icon">📜</span>
              {v}
            </Option>
          ))
        )}
      </div>
    </>
  );
}

function TraceQuestion({ puzzle, ...choice }: { puzzle: TracePuzzle } & ChoiceProps) {
  return (
    <>
      <p className="ask">Which trail is the flag&apos;s?</p>
      <MiniShelf values={puzzle.shelf} large />
      <div className="options row">
        {puzzle.options.map((id) => {
          const trail = traceOf(puzzle.shelf, id);
          return (
            <Option key={id} value={id} label={`Trail ${trail.join(", ")}`} {...choice}>
              <span aria-hidden className="opt-flag">
                🚩
              </span>
              <Trail trail={trail} top={Math.max(...puzzle.shelf)} />
            </Option>
          );
        })}
      </div>
    </>
  );
}

function BugQuestion({ puzzle, ...choice }: { puzzle: BugPuzzle } & ChoiceProps) {
  const bug = BUGS[puzzle.bug];
  return (
    <>
      <p className="ask">
        <span aria-hidden>🕵️ </span>Find the shelf that fools this plan
      </p>
      <p className="suspect">It {bug.label}.</p>
      <div className="options row">
        {puzzle.shelves.map((shelf, i) => (
          <Option key={shelf.join()} value={String(i)} label={`Shelf ${shelf.join(", ")}`} {...choice}>
            <MiniShelf values={shelf} />
            {choice.picked !== null && (
              <span className="opt-result" aria-hidden>
                {bug.run(shelf)} {bug.run(shelf) === Math.max(...shelf) ? "✓" : "✕"}
              </span>
            )}
          </Option>
        ))}
      </div>
    </>
  );
}

function Option({ value, label, picked, correct, onAnswer, children }: ChoiceProps & { value: string; label: string; children: ReactNode }) {
  const done = picked !== null;
  const state = !done ? "" : value === picked ? (value === correct ? "right" : "wrong") : value === correct ? "reveal" : "dim";
  return (
    <button type="button" className={`opt ${state}`} aria-label={label} data-answer={value} disabled={done} onClick={() => onAnswer(value)}>
      {children}
    </button>
  );
}

/** Bars as tall as the scrolls, for choices that are whole shelves. */
function MiniShelf({ values, large = false }: { values: number[]; large?: boolean }) {
  const lo = Math.min(0, ...values);
  const hi = Math.max(lo + 1, ...values);
  return (
    <span className={`mini-shelf ${large ? "large" : ""}`} aria-hidden>
      {values.map((v, i) => (
        <span key={i} className="mini-bar" style={{ height: `${14 + ((v - lo) / (hi - lo)) * 86}%` }}>
          <span className="mini-value">{v}</span>
        </span>
      ))}
    </span>
  );
}

/** A step line of the flag's height after each scroll. */
function Trail({ trail, top }: { trail: number[]; top: number }) {
  const lo = Math.min(0, ...trail);
  const hi = Math.max(lo + 1, top);
  const W = 100;
  const H = 84;
  const x = (i: number) => 8 + (i * (W - 16)) / Math.max(1, trail.length - 1);
  const y = (v: number) => H - 8 - ((v - lo) / (hi - lo)) * (H - 16);
  let d = `M ${x(0)} ${y(trail[0] as number)}`;
  for (let i = 1; i < trail.length; i += 1) d += ` H ${x(i)} V ${y(trail[i] as number)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trail" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {trail.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="currentColor" />
      ))}
    </svg>
  );
}

function Summary({ results, memory, onExit, onAgain }: { results: boolean[]; memory: Memory; onExit: () => void; onAgain: () => void }) {
  const now = useMemo(() => Date.now(), []);
  const score = results.filter(Boolean).length;
  const missed = results.some((r) => !r);
  const upcoming = PUZZLE_IDS.map((id) => memory[id]?.due).filter((d): d is number => d !== undefined && d > now);
  const wait = upcoming.length > 0 ? Math.min(...upcoming) - now : undefined;
  const known = Math.round(mastery(PUZZLE_IDS, memory) * 100);
  const more = PUZZLE_IDS.some((id) => memory[id] === undefined || memory[id]!.due <= now);
  return (
    <div className="practice-body summary">
      {results.length === 0 ? (
        <>
          <p className="big-emoji" aria-hidden>
            😴
          </p>
          <p className="ask">All caught up</p>
        </>
      ) : (
        <>
          <p className="big-emoji" aria-hidden>
            {score === results.length ? "🏆" : score * 2 >= results.length ? "🌟" : "💪"}
          </p>
          <p className="ask" aria-label={`Score ${score} of ${results.length}`}>
            {score} / {results.length}
          </p>
        </>
      )}
      <div className="known" role="img" aria-label={`Known: ${known} percent`}>
        <span className="known-fill" style={{ width: `${known}%` }} />
      </div>
      <p className="hint">{missed ? "Missed ones come back first next time." : wait !== undefined ? `Next review ${describeWait(wait)}.` : "Nice work."}</p>
      <div className="practice-actions">
        <button type="button" onClick={onExit}>
          Map
        </button>
        {more && (
          <button type="button" className="primary big" onClick={onAgain}>
            More ▶
          </button>
        )}
      </div>
    </div>
  );
}
