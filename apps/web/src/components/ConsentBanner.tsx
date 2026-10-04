import { useState } from "react";
import { getConsent, setConsent, track } from "../game/analytics.ts";

/** Asks once whether anonymous usage data may be recorded (FR-64). */
export function ConsentBanner() {
  const [visible, setVisible] = useState(() => getConsent() === "unknown");
  if (!visible) return null;
  const answer = (consent: "granted" | "denied") => {
    setConsent(consent);
    setVisible(false);
    if (consent === "granted") track("app_open", { after_consent: true });
  };
  return (
    <div className="consent" role="dialog" aria-label="Usage data">
      <p>
        <strong>Help us improve Vicoding?</strong> We'd like to record anonymous gameplay events (like which levels you finish and where you get stuck). No name, no
        account, nothing you type into your plans.
      </p>
      <div className="hand-buttons">
        <button type="button" className="primary" onClick={() => answer("granted")}>
          Yes, share anonymous data
        </button>
        <button type="button" onClick={() => answer("denied")}>
          No thanks
        </button>
      </div>
    </div>
  );
}
