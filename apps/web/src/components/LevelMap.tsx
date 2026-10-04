import { levels } from "@vicoding/levels";
import { isUnlocked, type Progress } from "../game/progress.ts";
import { PUZZLE_IDS } from "../practice/puzzles.ts";
import { dueCount, mastery } from "../practice/schedule.ts";
import { loadMemory } from "../practice/store.ts";

const ORDER = levels.map((l) => l.definition.id);

interface LevelMapProps {
  progress: Progress;
  onOpen: (id: string) => void;
  /** The plain-code trial opens after the last level. */
  trialUnlocked: boolean;
  trialDone: boolean;
  onOpenTrial: () => void;
  onPractice: () => void;
}

export function LevelMap({ progress, onOpen, trialUnlocked, trialDone, onOpenTrial, onPractice }: LevelMapProps) {
  const memory = loadMemory();
  const due = dueCount(PUZZLE_IDS, memory, Date.now());
  const known = Math.round(mastery(PUZZLE_IDS, memory) * 100);
  return (
    <div className="map">
      <header className="map-header">
        <div className="logo">Vicoding</div>
        <p className="tagline">Build it. Watch it run. Read the code.</p>
      </header>
      <section className="realm" aria-label="Arraia">
        <h2>Arraia, the Free City</h2>
        <p className="realm-intro">Captain Ada teaches the oldest skill of all: walking a line of tiles without losing your place.</p>
        <button type="button" className="practice-card" onClick={onPractice}>
          <span className="practice-card-icon" aria-hidden>
            ⚡
          </span>
          <span className="practice-card-title">Quick practice</span>
          <span className="practice-card-sub">The tallest scroll, in 3 minutes</span>
          <span className="practice-card-due">{due > 0 ? `${due} ready` : "All caught up"}</span>
          <span className="known" role="img" aria-label={`Known: ${known} percent`}>
            <span className="known-fill" style={{ width: `${known}%` }} />
          </span>
        </button>
        <ol className="path">
          {levels.map(({ definition }) => {
            const unlocked = isUnlocked(progress, ORDER, definition.id);
            const stars = progress[definition.id]?.stars ?? 0;
            return (
              <li key={definition.id}>
                <button
                  type="button"
                  className={`node ${unlocked ? "" : "locked"} ${progress[definition.id]?.completed ? "done" : ""}`}
                  onClick={() => onOpen(definition.id)}
                  disabled={!unlocked}
                >
                  <span className="node-number">{unlocked ? definition.order : "🔒"}</span>
                  <span className="node-title">{definition.title}</span>
                  <span className="node-source">{definition.source}</span>
                  <span className="stars small" aria-label={`${stars} of 3 stars`}>
                    {[1, 2, 3].map((s) => (
                      <span key={s} className={s <= stars ? "star on" : "star"}>
                        ★
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
          <li>
            <button type="button" className={`node trial-node ${trialUnlocked ? "" : "locked"} ${trialDone ? "done" : ""}`} onClick={onOpenTrial} disabled={!trialUnlocked}>
              <span className="node-number">{trialUnlocked ? "⚔" : "🔒"}</span>
              <span className="node-title">The Final Trial</span>
              <span className="node-source">Plain Python, no cards: like a real interview</span>
            </button>
          </li>
        </ol>
      </section>
    </div>
  );
}
