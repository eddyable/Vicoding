import type { Inputs } from "@vicoding/engine";
import type { LevelDefinition } from "@vicoding/levels";
import { useState, type ReactNode } from "react";
import { formatValue } from "../game/narrate.ts";

const STEP_LABELS: Record<LevelDefinition["step"], string> = {
  watch: "Watch & predict",
  fix: "Fix the bug",
  complete: "Complete the plan",
  build: "Build it",
  choose: "Choose your weapons",
};

/** Highlights the story's keywords (the clues that point at the pattern). */
function highlight(story: string, keywords: string[]): ReactNode[] {
  if (keywords.length === 0) return [story];
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return story.split(new RegExp(`(${escaped.join("|")})`, "g")).map((part, i) =>
    keywords.includes(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>,
  );
}

export function describeInput(input: Inputs): string {
  return Object.entries(input)
    .map(([name, value]) => `${name} = ${Array.isArray(value) && value.every((v) => typeof v === "string") ? `"${value.join("")}"` : formatValue(value)}`)
    .join(", ");
}

interface ScoutCardProps {
  level: LevelDefinition;
  examples: { label: string; input: Inputs }[];
  activeExample: number;
  onSelectExample: (index: number) => void;
}

export function ScoutCard({ level, examples, activeExample, onSelectExample }: ScoutCardProps) {
  const [hints, setHints] = useState(0);
  return (
    <section className="scout" aria-label="Problem">
      <div className="mentor">
        <div className="mentor-portrait" aria-hidden>
          ⚔
        </div>
        <div>
          <div className="mentor-name">{level.mentor.name}</div>
          <p className="mentor-line">{level.mentor.intro}</p>
        </div>
      </div>
      <p className="story">{highlight(level.story, level.keywords)}</p>
      <div className="examples" role="group" aria-label="Example inputs">
        {examples.map((example, i) => (
          <button
            key={example.label}
            type="button"
            className={`example ${i === activeExample ? "selected" : ""}`}
            onClick={() => onSelectExample(i)}
            aria-pressed={i === activeExample}
          >
            <span className="example-label">{example.label}</span>
            <code>{describeInput(example.input)}</code>
          </button>
        ))}
      </div>
      <div className="hints">
        <span className="step-badge">{STEP_LABELS[level.step]}</span>
        {level.mentor.hints.slice(0, hints).map((hint) => (
          <p key={hint} className="hint">
            💡 {hint}
          </p>
        ))}
        {hints < level.mentor.hints.length && (
          <button type="button" className="link" onClick={() => setHints(hints + 1)}>
            {hints === 0 ? "Need a hint?" : "Another hint"}
          </button>
        )}
      </div>
    </section>
  );
}
