export const SPEEDS = [
  { label: "½×", ms: 1200 },
  { label: "1×", ms: 650 },
  { label: "2×", ms: 300 },
  { label: "8×", ms: 80 },
] as const;

interface TimelineProps {
  position: number;
  length: number;
  playing: boolean;
  speed: number;
  ticks: number;
  budget: number;
  onSeek: (position: number) => void;
  onPlayPause: () => void;
  onSpeed: (index: number) => void;
}

export function Timeline({ position, length, playing, speed, ticks, budget, onSeek, onPlayPause, onSpeed }: TimelineProps) {
  const disabled = length === 0;
  const staminaPct = Math.min(100, (ticks / Math.max(1, budget)) * 100);
  return (
    <section className="timeline" aria-label="Timeline">
      <div className="timeline-buttons">
        <button type="button" onClick={() => onSeek(0)} disabled={disabled} aria-label="Back to start" title="Back to start">
          ⏮
        </button>
        <button type="button" onClick={() => onSeek(position - 1)} disabled={disabled || position === 0} aria-label="Step back" title="Step back">
          ◀
        </button>
        <button type="button" className="play" onClick={onPlayPause} disabled={disabled} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "⏸" : "▶"}
        </button>
        <button
          type="button"
          onClick={() => onSeek(position + 1)}
          disabled={disabled || position >= length}
          aria-label="Step forward"
          title="Step forward"
        >
          ▶|
        </button>
        <button type="button" onClick={() => onSeek(length)} disabled={disabled} aria-label="Jump to end" title="Jump to end">
          ⏭
        </button>
        <select value={speed} onChange={(e) => onSpeed(Number(e.target.value))} aria-label="Speed">
          {SPEEDS.map((s, i) => (
            <option key={s.label} value={i}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <input
        type="range"
        min={0}
        max={length}
        value={position}
        disabled={disabled}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Scrub timeline"
      />
      <div className="timeline-meta">
        <span>
          Step {position} / {length}
        </span>
        <span className="stamina" title="Operations spent compared with the level's budget for this input">
          Stamina
          <span className="stamina-bar" aria-hidden>
            <span style={{ width: `${staminaPct}%` }} className={ticks > budget ? "over" : ""} />
          </span>
          {ticks} / {budget}
        </span>
      </div>
    </section>
  );
}
