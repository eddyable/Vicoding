import type { InputSpec } from "@vicoding/levels";
import { useEffect, useRef, useState } from "react";
import type { Frame } from "../game/frame.ts";
import { formatValue } from "../game/narrate.ts";

/** Largest and smallest distance between tile centres; rows shrink to fit narrow screens, then scroll. */
const MAX_STEP = 56;
const MIN_STEP = 32;

interface BoardProps {
  frame: Frame;
  inputs: InputSpec[];
}

export function Board({ frame, inputs }: BoardProps) {
  const { state } = frame;
  const arrays = inputs.filter((i) => i.type !== "number");
  const scalars = inputs.filter((i) => i.type === "number").map((i) => i.name);
  const pointerNames = new Set(Object.keys(state.pointers));
  const banners = Object.entries(state.vars).filter(([name]) => !pointerNames.has(name) && !scalars.includes(name));

  return (
    <section className="board" aria-label="Board">
      {arrays.map((spec) => (
        <TileRow key={spec.name} frame={frame} name={spec.name} label={spec.label} />
      ))}

      <div className="banners" aria-label="Banners">
        {scalars.map((name) => (
          <span key={name} className="banner banner-given" title="Given by the level">
            {name} = {formatValue(state.vars[name])}
          </span>
        ))}
        {banners.map(([name, value]) => (
          <span key={name} className={`banner ${frame.changedVars.includes(name) ? "banner-changed" : ""}`}>
            ⚑ {name} = {formatValue(value)}
          </span>
        ))}
        {frame.compare && (
          <span className={`banner banner-compare ${frame.compare.result ? "yes" : "no"}`}>
            {formatValue(frame.compare.left)} {frame.compare.op} {formatValue(frame.compare.right)} → {frame.compare.result ? "yes" : "no"}
          </span>
        )}
      </div>

      {state.returned !== undefined && <div className="victory-banner">⚔ Victory: returns {formatValue(state.returned)}</div>}
    </section>
  );
}

function TileRow({ frame, name, label }: { frame: Frame; name: string; label: string }) {
  const { state } = frame;
  const values = state.arrays[name] ?? [];
  const ids = state.tileIds[name] ?? [];
  const n = values.length;
  const pointers = Object.entries(state.pointers).filter(([, p]) => p.array === name);
  const fault = state.fault?.code === "OUT_OF_BOUNDS" && state.fault.details.array === name ? state.fault : undefined;
  const impIndex = fault ? Math.max(-1, Math.min(n, fault.details.index as number)) : undefined;
  const isRead = (index: number) => frame.reads.some((r) => r.array === name && r.index === index);
  const isChanged = (index: number) => frame.changed.some((r) => r.array === name && r.index === index);

  // Pointers standing on the same tile are stacked upwards.
  const stackHeight = new Map<number, number>();
  const placed = pointers.map(([pointer, p]) => {
    const level = stackHeight.get(p.index) ?? 0;
    stackHeight.set(p.index, level + 1);
    return { pointer, index: p.index, level };
  });
  const lanes = Math.max(1, ...stackHeight.values());

  // Fit the row (tiles plus the two void tiles) to the available width when possible.
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
  const TILE = Math.round(step * 0.86);
  /** Pixel offset of tile position `index`; position -1 is the left void tile. */
  const left = (index: number) => (index + 1) * step;
  const tileStyle = { width: TILE, height: TILE, fontSize: Math.round(TILE * 0.38) };

  // When a long row still doesn't fit, keep the action in view: scroll so the
  // tiles being read or changed (or else the pointers) are centred.
  const focus = [
    ...frame.reads.filter((r) => r.array === name).map((r) => r.index),
    ...frame.changed.filter((r) => r.array === name).map((r) => r.index),
  ];
  const targets = focus.length > 0 ? focus : placed.map((p) => p.index);
  const focusKey = targets.join(",");
  useEffect(() => {
    const el = scroller.current;
    if (!el || targets.length === 0 || el.scrollWidth <= el.clientWidth) return;
    const lo = left(Math.min(...targets));
    const hi = left(Math.max(...targets)) + TILE;
    const visible = lo >= el.scrollLeft && hi <= el.scrollLeft + el.clientWidth;
    if (!visible) el.scrollTo({ left: (lo + hi) / 2 - el.clientWidth / 2, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the focus moves
  }, [focusKey]);

  const footprints = new Map<number, number>();
  for (const [pointer, trail] of Object.entries(frame.trails)) {
    if (state.pointers[pointer]?.array !== name) continue;
    for (const index of trail) footprints.set(index, (footprints.get(index) ?? 0) + 1);
  }

  return (
    <div className="row" aria-label={`${label}: ${values.map((v) => (typeof v === "string" ? v : formatValue(v))).join(", ")}`}>
      <div className="row-label">{label}</div>
      <div className="row-scroll" ref={scroller}>
        <div className="row-track" style={{ width: left(n + 1), height: lanes * 26 + TILE + 36 }}>
          {placed.map(({ pointer, index, level }) => (
            <div
              key={pointer}
              className="pointer"
              style={{ transform: `translate(${left(index)}px, ${(lanes - 1 - level) * 26}px)`, width: TILE }}
              aria-label={`Pointer ${pointer} on tile ${index}`}
            >
              <span>{pointer}</span>
            </div>
          ))}

          <div className="tiles" style={{ top: lanes * 26 }}>
            {[-1, n].map((index) => (
              <div key={`void${index}`} className="tile tile-void" style={{ ...tileStyle, transform: `translateX(${left(index)}px)` }} aria-hidden>
                {impIndex === index ? <span className="imp" title={fault?.message}>👺</span> : null}
              </div>
            ))}
            {values.map((value, index) => {
              const id = ids[index] ?? index;
              const classes = ["tile", isRead(index) ? "tile-read" : "", isChanged(index) ? "tile-changed" : ""].join(" ");
              return (
                <div key={id} className={classes} style={{ ...tileStyle, transform: `translateX(${left(index)}px)` }}>
                  {typeof value === "string" ? value : formatValue(value)}
                </div>
              );
            })}
            {Array.from({ length: n + 2 }, (_, k) => k - 1).map((index) => (
              <div
                key={`idx${index}`}
                className="tile-index"
                style={{ width: TILE, top: TILE + 4, transform: `translateX(${left(index)}px)` }}
                aria-hidden
              >
                {index >= 0 && index < n ? index : ""}
                {footprints.get(index) ? <span className="footprints">{"·".repeat(Math.min(5, footprints.get(index)!))}</span> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
