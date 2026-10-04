import { useState } from "react";
import { track } from "../game/analytics.ts";
import { scheduleFollowUp } from "../game/native.ts";

interface SurveyProps {
  trialPassed: boolean;
  onDone: () => void;
}

type Scale = 1 | 2 | 3 | 4 | 5;

const SCALES = [
  { key: "fun", question: "How fun was building plans and watching them run?", low: "Boring", high: "Very fun" },
  { key: "clarity", question: "How clear was it why the solutions work?", low: "Confusing", high: "Very clear" },
  { key: "keep_playing", question: "Would you keep playing to prepare for interviews?", low: "No way", high: "Definitely" },
] as const;

const COMPARISON = ["Better than LeetCode", "About the same", "Worse than LeetCode", "I haven't used LeetCode"];
const WOULD_PAY = ["Yes", "Maybe", "No"];

export function followUpLink(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}?trial=followup`;
}

/** The short post-slice survey (PRD §11), then the 24-hour follow-up invitation (FR-53). */
export function Survey({ trialPassed, onDone }: SurveyProps) {
  const [scales, setScales] = useState<Partial<Record<(typeof SCALES)[number]["key"], Scale>>>({});
  const [comparison, setComparison] = useState<string | null>(null);
  const [wouldPay, setWouldPay] = useState<string | null>(null);
  const [frustration, setFrustration] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reminder, setReminder] = useState<"none" | "scheduled" | "unavailable">("none");
  const [copied, setCopied] = useState(false);
  const complete = SCALES.every((s) => scales[s.key] !== undefined) && comparison !== null;

  const submit = () => {
    track("survey_submit", {
      trial_passed: trialPassed,
      fun: scales.fun ?? null,
      clarity: scales.clarity ?? null,
      keep_playing: scales.keep_playing ?? null,
      comparison,
      would_pay: wouldPay,
      frustration: frustration.trim().slice(0, 1000) || null,
      // Only stored if the player chose to give it, for the follow-up invitation.
      email: email.trim() || null,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="trial">
        <section className="trial-brief">
          <h2>Thank you! 🎉</h2>
          <p>
            One last thing, and it matters most: come back <strong>tomorrow</strong> and try the trial once more. It shows whether the pattern stuck, not just whether
            it was fresh.
          </p>
          <div className="follow-up">
            <code>{followUpLink()}</code>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(followUpLink());
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied ✔" : "Copy link"}
            </button>
          </div>
          <div className="hand-buttons">
            <button
              type="button"
              onClick={async () => setReminder((await scheduleFollowUp(followUpLink())) ? "scheduled" : "unavailable")}
              disabled={reminder === "scheduled"}
            >
              {reminder === "scheduled" ? "Reminder set for tomorrow ✔" : "🔔 Remind me tomorrow"}
            </button>
            <button type="button" className="primary" onClick={onDone}>
              Back to the map
            </button>
          </div>
          {reminder === "unavailable" && <p className="note">Reminders work in the mobile app. On the web, bookmark or copy the link above.</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="trial">
      <section className="trial-brief survey" aria-label="Survey">
        <h2>Two minutes of feedback</h2>
        <p className="note">Your answers are anonymous unless you choose to leave an email.</p>

        {SCALES.map((s) => (
          <fieldset key={s.key}>
            <legend>{s.question}</legend>
            <div className="scale">
              <span className="scale-end">{s.low}</span>
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <label key={n} className={scales[s.key] === n ? "selected" : ""}>
                  <input type="radio" name={s.key} value={n} checked={scales[s.key] === n} onChange={() => setScales((v) => ({ ...v, [s.key]: n }))} />
                  {n}
                </label>
              ))}
              <span className="scale-end">{s.high}</span>
            </div>
          </fieldset>
        ))}

        <fieldset>
          <legend>Compared with practicing on LeetCode, this was…</legend>
          <div className="choice-list">
            {COMPARISON.map((option) => (
              <label key={option} className={comparison === option ? "selected" : ""}>
                <input type="radio" name="comparison" checked={comparison === option} onChange={() => setComparison(option)} />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Would you pay about $10/month for the full game? (just a gut feeling)</legend>
          <div className="choice-list">
            {WOULD_PAY.map((option) => (
              <label key={option} className={wouldPay === option ? "selected" : ""}>
                <input type="radio" name="would_pay" checked={wouldPay === option} onChange={() => setWouldPay(option)} />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="text-field">
          What, if anything, frustrated you?
          <textarea value={frustration} onChange={(e) => setFrustration(e.target.value)} rows={3} maxLength={1000} />
        </label>

        <label className="text-field">
          Email for the follow-up invitation (optional)
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>

        <div className="hand-buttons">
          <button type="button" className="primary" onClick={submit} disabled={!complete}>
            Send feedback
          </button>
          <button type="button" className="link" onClick={onDone}>
            Skip
          </button>
        </div>
      </section>
    </div>
  );
}
