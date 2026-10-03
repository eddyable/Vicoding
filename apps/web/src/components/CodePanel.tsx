import { functionName, generate, type Language } from "@vicoding/codegen";
import type { NodeId, Program } from "@vicoding/engine";
import type { LevelDefinition } from "@vicoding/levels";
import { useMemo, useState } from "react";

const LANGUAGES: { id: Language; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
];
const STORAGE_KEY = "vicoding:v0:language";

function initialLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === "javascript" ? "javascript" : "python";
  } catch {
    return "python";
  }
}

interface CodePanelProps {
  program: Program;
  level: LevelDefinition;
  /** Card to highlight (the running card, or the one the player tapped). */
  activeCard: NodeId | undefined;
  onSelectCard?: (node: NodeId) => void;
  title?: string;
}

/** The Spell Scroll: the player's plan as real code, line-linked to the cards. */
export function CodePanel({ program, level, activeCard, onSelectCard, title = "Your plan as code" }: CodePanelProps) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const lines = useMemo(
    () =>
      generate(program, {
        language,
        name: functionName(level.title, language),
        params: level.inputs.map((i) => i.name),
      }),
    [program, language, level],
  );

  const choose = (next: Language) => {
    setLanguage(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Remembering the language is only a convenience.
    }
  };

  return (
    <section className="code-panel" aria-label={title}>
      <div className="code-head">
        <strong>{title}</strong>
        <div className="code-tabs" role="tablist" aria-label="Language">
          {LANGUAGES.map((l) => (
            <button key={l.id} type="button" role="tab" aria-selected={language === l.id} className={language === l.id ? "selected" : ""} onClick={() => choose(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <pre className="code" aria-label={`${language} code`}>
        {lines.map((line, i) => {
          const active = line.node !== undefined && line.node === activeCard;
          const content = "    ".repeat(line.indent) + line.text;
          return line.node !== undefined && onSelectCard ? (
            <button key={i} type="button" className={`code-line ${active ? "active" : ""}`} onClick={() => onSelectCard(line.node!)}>
              <span className="line-number">{i + 1}</span>
              {content}
            </button>
          ) : (
            <span key={i} className={`code-line ${active ? "active" : ""}`}>
              <span className="line-number">{i + 1}</span>
              {content}
            </span>
          );
        })}
      </pre>
      {onSelectCard && <p className="note">Tap a line to see which card wrote it.</p>}
    </section>
  );
}
