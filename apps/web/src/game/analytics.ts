/**
 * Anonymous playtest analytics (PRD §10, FR-64).
 *
 * - Nothing is recorded until the player consents.
 * - Each install gets a random id; no personal data is collected (the optional
 *   follow-up email is the player's own choice and is stored only on submit).
 * - Events queue in browser storage. If VITE_ANALYTICS_URL is set, batches are
 *   POSTed there; otherwise researchers export them from `?export=1`.
 */

export type EventName =
  | "app_open"
  | "level_start"
  | "plan_run"
  | "step_back_used"
  | "charge"
  | "ogre_shown"
  | "counterexample_shown"
  | "level_complete"
  | "code_reveal_line_tapped"
  | "war_council_answer"
  | "foresight_answer"
  | "hand_mode_done"
  | "transfer_test_start"
  | "transfer_test_submit"
  | "transfer_test_solution_shown"
  | "survey_submit";

export type Props = Record<string, string | number | boolean | null>;

export interface TrackedEvent {
  name: EventName;
  props: Props;
  /** Milliseconds since the epoch. */
  at: number;
  install: string;
  session: string;
  device: DeviceType;
  platform: "web" | "ios" | "android";
}

export type DeviceType = "phone" | "tablet" | "desktop";
export type Consent = "granted" | "denied" | "unknown";

const CONSENT_KEY = "vicoding:v0:analytics-consent";
const INSTALL_KEY = "vicoding:v0:install-id";
const QUEUE_KEY = "vicoding:v0:events";
const MAX_QUEUE = 5_000;
const ENDPOINT: string | undefined = import.meta.env.VITE_ANALYTICS_URL;

const session = randomId();
let platform: TrackedEvent["platform"] = "web";

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode, quota); analytics is best-effort.
  }
}

export function getConsent(): Consent {
  const value = read(CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : "unknown";
}

export function setConsent(consent: "granted" | "denied"): void {
  write(CONSENT_KEY, consent);
  if (consent === "denied") write(QUEUE_KEY, "[]");
}

function installId(): string {
  let id = read(INSTALL_KEY);
  if (!id) {
    id = randomId();
    write(INSTALL_KEY, id);
  }
  return id;
}

export function setPlatform(value: TrackedEvent["platform"]): void {
  platform = value;
}

/** Rough device class from screen size and pointer type. */
export function deviceType(width = typeof window === "undefined" ? 1280 : window.innerWidth, coarse = isCoarsePointer()): DeviceType {
  if (width < 640) return "phone";
  if (coarse && width < 1100) return "tablet";
  return "desktop";
}

function isCoarsePointer(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
}

export function readQueue(): TrackedEvent[] {
  try {
    return JSON.parse(read(QUEUE_KEY) ?? "[]") as TrackedEvent[];
  } catch {
    return [];
  }
}

/** Records an event if the player has consented. Never throws. */
export function track(name: EventName, props: Props = {}): void {
  if (getConsent() !== "granted") return;
  const event: TrackedEvent = { name, props, at: Date.now(), install: installId(), session, device: deviceType(), platform };
  const queue = readQueue();
  queue.push(event);
  write(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
  scheduleFlush();
}

let flushTimer: ReturnType<typeof setTimeout> | undefined;
let sentCount = 0;

/** Sends unsent events to the endpoint, if one is configured. */
function scheduleFlush(): void {
  if (!ENDPOINT || flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = undefined;
    flush();
  }, 5_000);
}

export function flush(): void {
  if (!ENDPOINT) return;
  const queue = readQueue();
  const batch = queue.slice(sentCount);
  if (batch.length === 0) return;
  const body = JSON.stringify(batch);
  const ok = typeof navigator !== "undefined" && "sendBeacon" in navigator && navigator.sendBeacon(ENDPOINT, body);
  if (ok) sentCount = queue.length;
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
}

/** Everything stored on this device, for the researcher export page. */
export function exportData(): { install: string | null; consent: Consent; events: TrackedEvent[] } {
  return { install: read(INSTALL_KEY), consent: getConsent(), events: readQueue() };
}
