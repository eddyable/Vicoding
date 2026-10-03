import type { EngineEvent, Value } from "@vicoding/engine";

export function formatValue(value: Value | undefined): string {
  if (value === undefined) return "—";
  if (value === null) return "nothing";
  if (Array.isArray(value)) return `[${value.map(formatValue).join(", ")}]`;
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

/** One plain-language line per event: the accessible text log of the run. */
export function describeEvent(event: EngineEvent): string | undefined {
  switch (event.type) {
    case "var.set":
      return `${event.name} = ${formatValue(event.value)}`;
    case "agent.place":
      return `Place ${event.agent} on tile ${event.index}`;
    case "agent.move":
      return `${event.agent} moves ${event.from} → ${event.to}`;
    case "array.read":
      return `${event.array}[${event.index}] is ${formatValue(event.value)}`;
    case "array.write":
      return `Write ${formatValue(event.value)} into ${event.array}[${event.index}]`;
    case "array.swap":
      return `Swap tiles ${event.i} and ${event.j}`;
    case "compare":
      return `${formatValue(event.left)} ${event.op} ${formatValue(event.right)} → ${event.result ? "yes" : "no"}`;
    case "arith":
      return `${event.left} ${event.op} ${event.right} = ${event.result}`;
    case "logic":
      return `${event.op} → ${event.result ? "yes" : "no"}`;
    case "branch":
      if (event.taken === "none") return "No branch matches";
      if (event.taken === "otherwise") return 'Take "otherwise"';
      return event.taken === 0 ? 'Take "if"' : `Take "else if" #${event.taken}`;
    case "loop.round":
      return `Round ${event.round}`;
    case "return":
      return `Victory! Return ${formatValue(event.value)}`;
    case "error":
      return event.fault.message;
  }
}

export function describeEvents(events: readonly EngineEvent[]): string {
  return events
    .map(describeEvent)
    .filter((line) => line !== undefined)
    .join(" · ");
}
