import { useState } from "react";
import { growthShape, type GrowthPoint } from "../game/growth.ts";

const W = 480;
const H = 220;
const PAD = { top: 16, right: 92, bottom: 34, left: 52 };

const SHAPE_TEXT = {
  linear: "Your plan grows in a straight line with the input, like the budget: the Ogre stays away.",
  faster: "Your plan grows faster than the input: double the tiles and the work more than doubles. The Ogre is coming.",
  overwhelmed: "Your plan's cost explodes as the input grows; the Ogre stopped it before the end.",
} as const;

/**
 * "Ogre's Shadow": operations spent vs. input size, with the stamina budget
 * and an n² reference. Values above the plot are clipped and marked.
 */
export function GrowthChart({ points }: { points: GrowthPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxN = points.at(-1)!.n;
  // The y-axis tops out at 3× the largest budget so a linear plan is clearly visible
  // and anything quadratic visibly shoots off the top.
  const yMax = points.at(-1)!.budget * 3;
  const x = (n: number) => PAD.left + (n / maxN) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - Math.min(v, yMax) / yMax) * (H - PAD.top - PAD.bottom);
  /** Polyline points, stopping at the first value that leaves the top of the chart. */
  const line = (values: (number | undefined)[]) => {
    const out: string[] = [];
    for (const [i, p] of points.entries()) {
      const v = values[i];
      if (v === undefined) break;
      out.push(`${x(p.n)},${y(v)}`);
      if (v > yMax) break;
    }
    return out.join(" ");
  };

  // Skip x labels that would collide with the previous one (small sizes bunch up on a linear axis).
  const xLabels: number[] = [];
  for (const p of points) if (xLabels.length === 0 || x(p.n) - x(xLabels.at(-1)!) >= 30) xLabels.push(p.n);
  const yours = points.map((p) => p.ticks);
  // Label the n² reference at the last point it reaches before leaving the chart.
  const quadIndex = points.findIndex((p) => p.quadratic > yMax);
  const quadLast = points[quadIndex === -1 ? points.length - 1 : Math.max(0, quadIndex - 1)]!;
  const quadraticLabel = { x: x(quadLast.n), y: y(quadLast.quadratic) };
  const shape = growthShape(points);
  const yTicks = [0, yMax / 3, (2 * yMax) / 3, yMax];
  const last = points.at(-1)!;
  const active = hover === null ? undefined : points[hover];

  return (
    <figure className="growth">
      <figcaption>
        <strong>Ogre's Shadow</strong>: steps spent as the row grows
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={SHAPE_TEXT[shape]} onMouseLeave={() => setHover(null)}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="grid" />
            <text x={PAD.left - 6} y={y(t) + 4} className="axis" textAnchor="end">
              {Math.round(t).toLocaleString("en-US")}
            </text>
          </g>
        ))}
        {xLabels.map((n) => (
          <text key={n} x={x(n)} y={H - PAD.bottom + 16} className="axis" textAnchor="middle">
            {n}
          </text>
        ))}
        <text x={(PAD.left + W - PAD.right) / 2} y={H - 4} className="axis" textAnchor="middle">
          tiles (n)
        </text>

        <polyline points={line(points.map((p) => p.quadratic))} className="ref ref-quadratic" />
        <polyline points={line(points.map((p) => p.budget))} className="ref ref-budget" />
        <text x={x(last.n) + 6} y={y(last.budget) + 4} className="ref-label">
          budget
        </text>
        {quadraticLabel && (
          <text x={quadraticLabel.x + 6} y={Math.max(PAD.top + 10, quadraticLabel.y)} className="ref-label">
            n²
          </text>
        )}

        <polyline points={line(yours)} className="series" />
        {points.map((p) =>
          p.ticks === undefined ? (
            <text key={p.n} x={x(p.n)} y={PAD.top + 4} className="ogre-mark" textAnchor="middle">
              👹
            </text>
          ) : (
            p.ticks > yMax ? (
            <text key={p.n} x={x(p.n)} y={PAD.top + 4} className="ogre-mark" textAnchor="middle">
              ↑
            </text>
          ) : (
            <circle key={p.n} cx={x(p.n)} cy={y(p.ticks)} r={4} className="marker" />
          )
          ),
        )}
        {yours.at(-1) !== undefined && yours.at(-1)! <= yMax && (
          <text x={x(last.n) + 6} y={y(yours.at(-1)!) - 6} className="series-label">
            your plan
          </text>
        )}

        {/* Hit targets wider than the marks, one per input size. */}
        {points.map((p, i) => (
          <rect
            key={`hit${p.n}`}
            x={x(p.n) - 18}
            y={PAD.top}
            width={36}
            height={H - PAD.top - PAD.bottom}
            className="hit"
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            tabIndex={0}
            aria-label={`${p.n} tiles: ${p.ticks === undefined ? "stopped by the Ogre" : `${p.ticks} steps`}, budget ${p.budget}`}
          />
        ))}
        {active && (
          <line x1={x(active.n)} x2={x(active.n)} y1={PAD.top} y2={H - PAD.bottom} className="crosshair" />
        )}
      </svg>
      {active && (
        <div className="growth-tooltip" role="status">
          <strong>{active.n} tiles</strong> · your plan:{" "}
          {active.ticks === undefined ? "stopped by the Ogre" : `${active.ticks.toLocaleString("en-US")} steps`} · budget:{" "}
          {active.budget.toLocaleString("en-US")}
        </div>
      )}
      <p className="growth-verdict">{SHAPE_TEXT[shape]}</p>
      <details>
        <summary>Show the numbers</summary>
        <table className="growth-table">
          <thead>
            <tr>
              <th>tiles</th>
              <th>your plan</th>
              <th>budget</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.n}>
                <td>{p.n}</td>
                <td>{p.ticks === undefined ? "stopped" : p.ticks.toLocaleString("en-US")}</td>
                <td>{p.budget.toLocaleString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
