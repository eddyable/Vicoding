import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The mobile app is the web game bundled offline (ADR 0001): `webDir` points
 * at the web app's production build, copied into the native projects by `cap sync`.
 */
const config: CapacitorConfig = {
  appId: "app.vicoding.game",
  appName: "Vicoding",
  webDir: "../web/dist",
  ios: {
    contentInset: "always",
  },
  plugins: {
    LocalNotifications: {
      iconColor: "#1e3a8a",
    },
  },
};

export default config;
