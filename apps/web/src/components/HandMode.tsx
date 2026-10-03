import { valuesEqual, type Inputs, type Value } from "@vicoding/engine";
import type { LevelModule } from "@vicoding/levels";
import { useState } from "react";
import { formatValue } from "../game/narrate.ts";

interface HandModeProps {
  level: LevelModule;
  input: Inputs;
  /** Called with true when the player solved it by hand and wants their moves written down. */
  onDone: (useDraft: boolean) => void;
}

/**
 * Hand Mode: the player walks the pointer and raises the banner themselves,
 * which is how you'd solve a small example on a whiteboard before coding it.
 */
export function HandMode({ level, input, onDone }: HandModeProps) {
  const spec = level.definition.inputs.find((i) => i.type !== "number")!;
  const tiles = (input[spec.name] as Value[]) ?? [];
  const [pos, setPos] = useState<number | null>(null);
  const [best, setBest] = useState<Value | null>(null);
  const [verdict, setVerdict] = useState<"right" | "wrong" | null>(null);
  const [visited, setVisited] = useState<number[]>([]);
  const expected = level.reference(input);
  const atEnd = pos !== null && pos >= tiles.length - 1;

  const reset = () => {
    setPos(null);
    setBest(null);
    setVerdict(null);
    setVisited([]);
  };
  const step = (to: number) => {
    setPos(to);
    setVisited((v) => [...v, to]);
  };

  return (
    <section className="hand-mode" aria-label="Solve it by hand">
      <div className="picker-title">✋ Solve it by hand first</div>
      <p>
        Walk your soldier along the {spec.label}, one at a time. Whenever you meet a scroll taller than your banner, raise the banner there. When you reach the end,
        report the banner's height.
      </p>

      <div className="hand-row" role="list">
        {tiles.map((value, i) => (
          <div key={i} role="listitem" className={`hand-tile ${pos === i ? "here" : ""} ${visited.includes(i) && pos !== i ? "visited" : ""}`}>
            {pos === i && (
              <span className="hand-soldier" aria-label="Your soldier">
                i
              </span>
            )}
            <span className="tile-value">{formatValue(value)}</span>
            <span className="tile-number">{i}</span>
          </div>
        ))}
      </div>

      <div className="banners">
        <span className="banner">⚑ best = {best === null ? "(not raised yet)" : formatValue(best)}</span>
      </div>

      {verdict === null && (
        <div className="hand-buttons">
          {pos === null ? (
            <button type="button" className="primary" onClick={() => step(0)}>
              Place the soldier on the first scroll
            </button>
          ) : (
            <>
              <button type="button" onClick={() => setBest(tiles[pos] ?? null)}>
                ⚑ Raise the banner here
              </button>
              {!atEnd ? (
                <button type="button" className="primary" onClick={() => step(pos + 1)}>
                  Step ➜
                </button>
              ) : (
                <button type="button" className="primary" onClick={() => setVerdict(best !== null && valuesEqual(best, expected) ? "right" : "wrong")}>
                  Report: the tallest is {best === null ? "…" : formatValue(best)}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {verdict === "right" && (
        <div className="verdict pass">
          ✔ Exactly! You did it by hand. Now teach your soldier to do it alone.
          <div className="hand-buttons">
            <button type="button" className="primary" onClick={() => onDone(true)}>
              Write down my moves as a plan
            </button>
          </div>
        </div>
      )}
      {verdict === "wrong" && (
        <div className="verdict fail">
          ✘ Not quite: the tallest scroll is {formatValue(expected)}.{" "}
          <button type="button" className="link" onClick={reset}>
            Try again
          </button>
        </div>
      )}

      <button type="button" className="link" onClick={() => onDone(false)}>
        Skip and build the plan myself
      </button>
    </section>
  );
}
