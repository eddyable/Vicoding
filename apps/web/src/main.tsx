import { Capacitor } from "@capacitor/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline support for the web version (installable PWA). The native app bundles the game already.
if (!Capacitor.isNativePlatform() && import.meta.env.PROD) {
  void import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true }));
}
