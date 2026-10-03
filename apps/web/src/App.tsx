import type { Program } from "@vicoding/engine";
import { levels } from "@vicoding/levels";
import { useState } from "react";
import { LevelMap } from "./components/LevelMap.tsx";
import { LevelScreen } from "./components/LevelScreen.tsx";
import { isUnlocked, loadProgress, saveProgress, type Progress } from "./game/progress.ts";

const ORDER = levels.map((l) => l.definition.id);

export function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [current, setCurrent] = useState<string | null>(null);

  const update = (id: string, fn: (p: Progress[string]) => Progress[string]) => {
    setProgress((prev) => {
      const next = { ...prev, [id]: fn(prev[id] ?? { stars: 0, completed: false }) };
      saveProgress(next);
      return next;
    });
  };

  const level = levels.find((l) => l.definition.id === current);
  if (!level) {
    return <LevelMap progress={progress} onOpen={(id) => isUnlocked(progress, ORDER, id) && setCurrent(id)} />;
  }

  const index = ORDER.indexOf(level.definition.id);
  const nextId = ORDER[index + 1];
  return (
    <LevelScreen
      key={level.definition.id}
      level={level}
      savedPlan={progress[level.definition.id]?.plan}
      stars={progress[level.definition.id]?.stars ?? 0}
      hasNext={nextId !== undefined}
      onPlanChange={(plan: Program) => update(level.definition.id, (p) => ({ ...p, plan }))}
      onComplete={(stars) =>
        update(level.definition.id, (p) => ({ ...p, completed: true, stars: Math.max(p.stars, stars) as 1 | 2 | 3 }))
      }
      onNext={() => setCurrent(nextId ?? null)}
      onExit={() => setCurrent(null)}
    />
  );
}
