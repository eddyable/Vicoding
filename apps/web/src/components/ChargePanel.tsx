import type { Program } from "@vicoding/engine";
import type { ChargeCase, ChargeReport, LevelDefinition } from "@vicoding/levels";
import { useState } from "react";
import type { GrowthPoint } from "../game/growth.ts";
import { formatValue } from "../game/narrate.ts";
import { CodePanel } from "./CodePanel.tsx";
import { GrowthChart } from "./GrowthChart.tsx";
import { describeInput } from "./ScoutCard.tsx";

const WAVE_NAMES: Record<ChargeCase["wave"], string> = {
  vanguard: "Wave 1 · Vanguard (examples)",
  skirmishers: "Wave 2 · Skirmishers (edge cases)",
  jester: "Wave 4 · Jester's Gambit",
};

interface ChargePanelProps {
  report: ChargeReport;
  level: LevelDefinition;
  program: Program;
  growth: GrowthPoint[] | null;
  hasNext: boolean;
  onReplay: (failure: ChargeCase) => void;
  onNext: () => void;
  onClose: () => void;
}

export function ChargePanel({ report, level, program, growth, hasNext, onReplay, onNext, onClose }: ChargePanelProps) {
  const [answer, setAnswer] = useState<number | null>(null);
  const { horde, stars } = report;
  const waveCases = (wave: ChargeCase["wave"]) => ({ wave, cases: report.cases.filter((c) => c.wave === wave) });
  const before = [waveCases("vanguard"), waveCases("skirmishers")];
  const after = [waveCases("jester")];
  const renderWave = ({ wave, cases }: { wave: ChargeCase["wave"]; cases: ChargeCase[] }) => (
    <div key={wave} className="wave">
      <div className="wave-name">{WAVE_NAMES[wave]}</div>
      {cases.map((c) => (
        <div key={c.label} className={`wave-case ${c.passed ? "pass" : "fail"}`}>
          <span>{c.passed ? "✔" : "✘"}</span>
          <span className="case-label">{c.label}</span>
          {!c.passed && (
            <span className="case-detail">
              <code>{describeInput(c.input)}</code>
              {c.fault ? ` · ${c.fault.message}` : ` · expected ${formatValue(c.expected)}, got ${formatValue(c.actual)}`}
            </span>
          )}
        </div>
      ))}
    </div>
  );
  const ogre = horde.overwhelmed ? 20 : horde.ticks / horde.budget;
  const council = level.warCouncil;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet charge" role="dialog" aria-modal="true" aria-label="Charge results" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <strong>{stars > 0 ? "Victory!" : "The waves broke through"}</strong>
          <button type="button" className="icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="stars" aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map((s) => (
            <span key={s} className={s <= stars ? "star on" : "star"}>
              ★
            </span>
          ))}
        </div>
        <ul className="star-rules">
          <li className={stars >= 1 ? "ok" : ""}>★ Correct on every wave</li>
          <li className={horde.withinBudget ? "ok" : ""}>★★ Fast enough: the Ogre stays away ({level.targets.time})</li>
          <li className={report.cards <= report.par ? "ok" : ""}>
            ★★★ Elegant: {report.cards} cards (par {report.par})
          </li>
        </ul>

        {before.map(renderWave)}

        <div className="wave">
          <div className="wave-name">Wave 3 · The Horde ({horde.n.toLocaleString("en-US")} tiles)</div>
          <div className={`wave-case ${horde.withinBudget ? "pass" : "fail"}`}>
            <span>{horde.withinBudget ? "✔" : "👹"}</span>
            <span className="case-label">
              {horde.overwhelmed
                ? `Big-O the Ogre overwhelmed your plan: more than ${(horde.budget * 20).toLocaleString("en-US")} steps.`
                : `${horde.ticks.toLocaleString("en-US")} steps of ${horde.budget.toLocaleString("en-US")} stamina.`}
            </span>
          </div>
          {!horde.withinBudget && (
            <div className="ogre" style={{ fontSize: `${Math.min(6, 1.5 + Math.log2(Math.max(1, ogre)))}rem` }} aria-hidden>
              👹
            </div>
          )}
        </div>

        {after.map(renderWave)}

        {growth && <GrowthChart points={growth} />}

        {report.firstFailure && (
          <button type="button" className="primary" onClick={() => onReplay(report.firstFailure!)}>
            ⚡ Show me where it goes wrong
          </button>
        )}

        {stars > 0 && (
          <div className="scroll-reveal">
            <div className="wave-name">📜 Your Spell Scroll: this is what you just wrote</div>
            <CodePanel program={program} level={level} activeCard={undefined} title="Your plan as code" />
          </div>
        )}

        {stars > 0 && (
          <div className="council">
            <div className="wave-name">War Council</div>
            <p>{council.question}</p>
            <div className="council-options">
              {council.options.map((option, i) => (
                <button
                  key={option}
                  type="button"
                  className={`option ${answer === null ? "" : i === council.answer ? "correct" : i === answer ? "wrong" : ""}`}
                  onClick={() => answer === null && setAnswer(i)}
                  disabled={answer !== null && i !== answer && i !== council.answer}
                >
                  {option}
                </button>
              ))}
            </div>
            {answer !== null && <p className="explanation">{council.explanation}</p>}
            <div className="sheet-foot">
              <button type="button" onClick={onClose}>
                Keep improving
              </button>
              <button type="button" className="primary" onClick={onNext}>
                {hasNext ? "Next level →" : "Back to the map"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
