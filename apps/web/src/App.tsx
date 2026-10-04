import type { Program } from "@vicoding/engine";
import { levels, validPalindrome } from "@vicoding/levels";
import { useEffect, useState } from "react";
import { ConsentBanner } from "./components/ConsentBanner.tsx";
import { ExportPage } from "./components/ExportPage.tsx";
import { LevelMap } from "./components/LevelMap.tsx";
import { LevelScreen } from "./components/LevelScreen.tsx";
import { PracticeScreen } from "./components/PracticeScreen.tsx";
import { setPlatform, track } from "./game/analytics.ts";
import { nativePlatform, onFollowUpTapped } from "./game/native.ts";
import { isUnlocked, loadProgress, saveProgress, type Progress } from "./game/progress.ts";
import { Survey } from "./trial/Survey.tsx";
import { TransferTest, type TrialMode } from "./trial/TransferTest.tsx";

const ORDER = levels.map((l) => l.definition.id);
const TRIAL_ID = validPalindrome.id;

type Screen =
  | { kind: "map" }
  | { kind: "level"; id: string }
  | { kind: "practice" }
  | { kind: "trial"; mode: TrialMode }
  | { kind: "survey"; passed: boolean }
  | { kind: "export" };

/** Deep links: `?trial=followup` (24-hour follow-up) and `?export=1` (researcher export). */
function initialScreen(): Screen {
  const params = new URLSearchParams(window.location.search);
  if (params.get("export") === "1") return { kind: "export" };
  if (params.get("practice") === "1") return { kind: "practice" };
  if (params.get("trial") === "followup") return { kind: "trial", mode: "followup" };
  return { kind: "map" };
}

export function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [screen, setScreen] = useState<Screen>(initialScreen);

  useEffect(() => {
    setPlatform(nativePlatform());
    track("app_open", { screen: screen.kind });
    onFollowUpTapped(() => setScreen({ kind: "trial", mode: "followup" }));
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (id: string, fn: (p: Progress[string]) => Progress[string]) => {
    setProgress((prev) => {
      const next = { ...prev, [id]: fn(prev[id] ?? { stars: 0, completed: false }) };
      saveProgress(next);
      return next;
    });
  };

  const toMap = () => {
    // Drop deep-link parameters so a reload returns to the map.
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
    setScreen({ kind: "map" });
  };

  let content;
  if (screen.kind === "export") {
    content = <ExportPage onExit={toMap} />;
  } else if (screen.kind === "trial") {
    content = (
      <TransferTest
        mode={screen.mode}
        onExit={toMap}
        onFinish={({ passed }) => {
          if (screen.mode === "first") {
            update(TRIAL_ID, (p) => ({ ...p, completed: true }));
            setScreen({ kind: "survey", passed });
          } else {
            toMap();
          }
        }}
      />
    );
  } else if (screen.kind === "practice") {
    content = <PracticeScreen onExit={toMap} />;
  } else if (screen.kind === "survey") {
    content = <Survey trialPassed={screen.passed} onDone={toMap} />;
  } else if (screen.kind === "level") {
    const level = levels.find((l) => l.definition.id === screen.id)!;
    const index = ORDER.indexOf(level.definition.id);
    const nextId = ORDER[index + 1];
    content = (
      <LevelScreen
        key={level.definition.id}
        level={level}
        savedPlan={progress[level.definition.id]?.plan}
        stars={progress[level.definition.id]?.stars ?? 0}
        nextLabel={nextId ? "Next level →" : "Face the Final Trial →"}
        onPlanChange={(plan: Program) => update(level.definition.id, (p) => ({ ...p, plan }))}
        onComplete={(stars) =>
          update(level.definition.id, (p) => ({ ...p, completed: true, stars: Math.max(p.stars, stars) as 1 | 2 | 3 }))
        }
        onNext={() => (nextId ? setScreen({ kind: "level", id: nextId }) : setScreen({ kind: "trial", mode: "first" }))}
        onExit={toMap}
      />
    );
  } else {
    content = (
      <LevelMap
        progress={progress}
        trialUnlocked={progress[ORDER.at(-1)!]?.completed === true}
        trialDone={progress[TRIAL_ID]?.completed === true}
        onOpen={(id) => isUnlocked(progress, ORDER, id) && setScreen({ kind: "level", id })}
        onOpenTrial={() => setScreen({ kind: "trial", mode: "first" })}
        onPractice={() => setScreen({ kind: "practice" })}
      />
    );
  }

  return (
    <>
      {content}
      <ConsentBanner />
    </>
  );
}
