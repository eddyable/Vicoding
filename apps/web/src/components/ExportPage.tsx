import { useMemo } from "react";
import { exportData } from "../game/analytics.ts";

/**
 * Researcher view (`?export=1`): during moderated playtests without a backend,
 * download this device's events at the end of the session.
 */
export function ExportPage({ onExit }: { onExit: () => void }) {
  const data = useMemo(exportData, []);
  const json = JSON.stringify(data, null, 2);
  const counts = data.events.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.name]: (acc[e.name] ?? 0) + 1 }), {});
  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `vicoding-events-${data.install ?? "unknown"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="map">
      <button type="button" className="link" onClick={onExit}>
        ← Map
      </button>
      <h1>Playtest data on this device</h1>
      <p>
        Consent: <strong>{data.consent}</strong> · Install: <code>{data.install ?? "none yet"}</code> · Events: <strong>{data.events.length}</strong>
      </p>
      <ul>
        {Object.entries(counts).map(([name, count]) => (
          <li key={name}>
            <code>{name}</code>: {count}
          </li>
        ))}
      </ul>
      <button type="button" className="primary" onClick={download} disabled={data.events.length === 0}>
        Download JSON
      </button>
    </div>
  );
}
