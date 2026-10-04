import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";

/**
 * Native touches for the mobile app (ADR 0001 §5): haptics and the follow-up
 * reminder. On the web these quietly do nothing (or report "unavailable").
 */

export const isNative = (): boolean => Capacitor.isNativePlatform();

export function nativePlatform(): "web" | "ios" | "android" {
  const platform = Capacitor.getPlatform();
  return platform === "ios" || platform === "android" ? platform : "web";
}

export function hapticSuccess(): void {
  if (isNative()) void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
}

export function hapticError(): void {
  if (isNative()) void Haptics.notification({ type: NotificationType.Error }).catch(() => undefined);
}

export function hapticTap(): void {
  if (isNative()) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
}

const FOLLOW_UP_ID = 24;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Schedules the "come back tomorrow" reminder. Returns false where reminders aren't available. */
export async function scheduleFollowUp(link: string): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== "granted") return false;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: FOLLOW_UP_ID,
          title: "The Trial awaits ⚔",
          body: "One day later: can you still solve it without the cards?",
          schedule: { at: new Date(Date.now() + DAY_MS) },
          extra: { link },
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

/** Opens the follow-up trial when the player taps the reminder. */
export function onFollowUpTapped(open: () => void): void {
  if (!isNative()) return;
  void LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
    if (action.notification.id === FOLLOW_UP_ID) open();
  });
}
