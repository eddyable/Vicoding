import { useEffect, useRef, useState } from "react";
import type { Frame } from "../game/frame.ts";
import { formatValue } from "../game/narrate.ts";

/** The levels that draw their array as a shelf of scrolls instead of numbered tiles. */
export function usesScrollBoard(levelId: string): boolean {
  return levelId === "arraia-01-tallest-scroll";
}

const MAX_STEP = 64;
const MIN_STEP = 30;
const CHART_HEIGHT = 150;
const STUB = 14;
const WALKER = 36;

const WALKERS = ["🧙", "🧝", "🧚"];

interface ScrollBoardProps {
  frame: Frame;
  /** Name of the array input to draw. */
  array: string;
  /** Names of inputs the level gives as plain numbers; never drawn as banners. */
  scalars: string[];
}

/**
 * A shelf of scrolls whose heights are their values. A walker hops along the
 * shelf and a flag line shows the best height found so far, so "is this one
 * taller?" is answered by looking, not reading.
 */
export function ScrollBoard({ frame, array, scalars }: ScrollBoardProps) {
  const { state } = frame;
  const values = (state.arrays[array] ?? []) as number[];
  const ids = state.tileIds[array] ?? [];
  const n = values.length;

  const pointerNames = new Set(Object.keys(state.pointers));
  const flags = Object.entries(state.vars).filter(
    (entry): entry is [string, number] => !pointerNames.has(entry[0]) && !scalars.includes(entry[0]) && typeof entry[1] === "number",
  );
  const records = flags.length > 0 ? (frame.varSets[flags[0]![0]] ?? 0) : 0;

  const walkers = Object.entries(state.pointers)
    .filter(([, p]) => p.array === array)
    .map(([name, p], k) => ({ name, index: p.index, glyph: WALKERS[k % WALKERS.length]! }));
  const stack = new Map<number, number>();
  const placed = walkers.map((w) => {
    const level = stack.get(w.index) ?? 0;
    stack.set(w.index, level + 1);
    return { ...w, level };
  });
  const lanes = Math.max(1, ...stack.values());
  const sky = lanes * WALKER + 22;

  const fault = state.fault?.code === "OUT_OF_BOUNDS" && state.fault.details.array === array ? state.fault : undefined;
  const impIndex = fault ? Math.max(-1, Math.min(n, fault.details.index as number)) : undefined;

  const lo = Math.min(0, ...values);
  const hi = Math.max(lo + 1, ...values);
  const heightOf = (v: number) => (v < lo ? STUB : STUB + ((v - lo) / (hi - lo)) * (CHART_HEIGHT - STUB));
  const lineY = (v: number) => Math.max(0, Math.min(CHART_HEIGHT, heightOf(v)));

  const scroller = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setAvailable(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const step = available > 0 ? Math.max(MIN_STEP, Math.min(MAX_STEP, Math.floor(available / (n + 2)))) : MAX_STEP;
  const bar = Math.round(step * 0.78);
  /** Pixel offset of position `index`; column -1 holds the flag. */
  const left = (index: number) => (index + 1) * step + (step - bar) / 2;

  const focus = [...frame.reads.filter((r) => r.array === array).map((r) => r.index), ...placed.map((p) => p.index)];
  const focusKey = focus.join(",");
  useEffect(() => {
    const el = scroller.current;
    if (!el || focus.length === 0 || el.scrollWidth <= el.clientWidth) return;
    const from = left(Math.min(...focus));
    const to = left(Math.max(...focus)) + bar;
    const visible = from >= el.scrollLeft && to <= el.scrollLeft + el.clientWidth;
    if (!visible) el.scrollTo({ left: (from + to) / 2 - el.clientWidth / 2, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the focus moves
  }, [focusKey]);

  const isRead = (index: number) => frame.reads.some((r) => r.array === array && r.index === index);
  const won = state.returned !== undefined;
  const winner = typeof state.returned === "number" ? state.returned : undefined;
  const verdict = frame.reads.some((r) => r.array === array) ? frame.compare : undefined;

  return (
    <section className={`scrollboard ${won ? "scrollboard-won" : ""}`} aria-label={`Shelf of scrolls: ${values.map((v) => formatValue(v)).join(", ")}`}>
      <div className="scroll-hud">
        {records > 0 && (
          <span key={records} className="hud-chip hud-records" aria-label={`Records: ${records}`}>
            <span aria-hidden>🚩</span> ×{records}
          </span>
        )}
        {state.fault && !fault && (
          <span className="hud-chip hud-fault" role="img" aria-label={state.fault.message}>
            💥
          </span>
        )}
        {won && (
          <span className="hud-chip victory-banner" role="img" aria-label={`Victory: returns ${formatValue(state.returned)}`}>
            <span aria-hidden>🏆</span> {formatValue(state.returned)}
          </span>
        )}
      </div>

      <div className="scroll-viewport" ref={scroller}>
        <div className="scroll-track" style={{ width: (n + 2) * step, height: sky + CHART_HEIGHT + 4 }}>
          {placed.map(({ name, index, glyph, level }) => {
            const inRange = index >= 0 && index < n;
            const standing = inRange ? heightOf(values[index] as number) : STUB;
            const top = sky + CHART_HEIGHT - standing - WALKER - level * WALKER;
            return (
              <div
                key={name}
                className={`walker ${inRange || fault ? "" : "walker-off"}`}
                style={{ transform: `translate(${left(index) + bar / 2 - WALKER / 2}px, ${top}px)`, width: WALKER, height: WALKER }}
                role="img"
                aria-label={`Walker ${name} on scroll ${index + 1}`}
              >
                <span key={index} className="walker-body" aria-hidden>
                  {glyph}
                </span>
                {level === 0 && verdict && (
                  <span className={`verdict-bubble ${verdict.result ? "yes" : "no"}`} aria-hidden>
                    {verdict.result ? "✓" : "✕"}
                  </span>
                )}
              </div>
            );
          })}

          <div className="scroll-chart" style={{ top: sky, height: CHART_HEIGHT }}>
            {flags.map(([name, value], k) => {
              const y = lineY(value);
              const pulse = frame.changedVars.includes(name);
              return (
                <div
                  key={name}
                  className={`record-line record-${k % 2} ${pulse ? "record-pulse" : ""} ${won ? "record-won" : ""}`}
                  style={{ transform: `translateY(${-y}px)` }}
                  role="img"
                  aria-label={`${name} = ${formatValue(value)}`}
                >
                  <span className="flag" key={frame.varSets[name] ?? 0}>
                    <span className="flag-cloth">🚩</span>
                    <span className="flag-value">{formatValue(value)}</span>
                  </span>
                </div>
              );
            })}

            {fault &&
              [-1, n].map((index) => (
                <div key={`void${index}`} className="scroll scroll-void" style={{ width: bar, height: STUB + 20, transform: `translateX(${left(index)}px)` }} aria-hidden>
                  {impIndex === index ? <span className="imp">👺</span> : null}
                </div>
              ))}

            {values.map((value, index) => {
              const classes = ["scroll", isRead(index) ? "scroll-read" : "", won && value === winner ? "scroll-win" : ""].filter(Boolean).join(" ");
              return (
                <div
                  key={ids[index] ?? index}
                  className={classes}
                  style={{ width: bar, height: heightOf(value), transform: `translateX(${left(index)}px)`, fontSize: Math.max(11, Math.round(bar * 0.34)) }}
                >
                  <span className="scroll-value">{formatValue(value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
