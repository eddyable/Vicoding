import { cpSync, createReadStream, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const require = createRequire(import.meta.url);
const PYODIDE_DIR = dirname(require.resolve("pyodide/package.json"));
/** Pyodide runtime files the browser needs (no maps, typings or demo pages). */
const PYODIDE_FILES = readdirSync(PYODIDE_DIR).filter((f) => /\.(mjs|js|wasm|zip|json)$/.test(f) && f !== "package.json");
const MIME: Record<string, string> = {
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".wasm": "application/wasm",
  ".zip": "application/zip",
  ".json": "application/json",
};

/**
 * Self-hosts Pyodide under /pyodide/ so the transfer test works offline and
 * inside the mobile app, without depending on a CDN.
 */
function pyodideAssets(): Plugin {
  let outDir = "dist";
  return {
    name: "vicoding-pyodide-assets",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/pyodide\/([^?]+)/);
        const file = match ? join(PYODIDE_DIR, match[1]!) : undefined;
        if (!file || !PYODIDE_FILES.includes(match![1]!) || !existsSync(file)) return next();
        res.setHeader("Content-Type", MIME[extname(file)] ?? "application/octet-stream");
        res.setHeader("Content-Length", statSync(file).size);
        createReadStream(file).pipe(res);
      });
    },
    writeBundle() {
      const target = join(outDir, "pyodide");
      mkdirSync(target, { recursive: true });
      for (const file of PYODIDE_FILES) cpSync(join(PYODIDE_DIR, file), join(target, file));
    },
  };
}

export default defineConfig({
  // Set by the GitHub Pages deploy workflow so assets resolve under /<repo>/; "/" for local dev and previews.
  base: process.env.VITE_BASE ?? "/",
  plugins: [
    react(),
    pyodideAssets(),
    VitePWA({
      registerType: "autoUpdate",
      // Registered from main.tsx, and only on the web: the native app is already offline.
      injectRegister: false,
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Vicoding",
        short_name: "Vicoding",
        description: "Learn coding-interview patterns by building algorithms visually.",
        theme_color: "#1e3a8a",
        background_color: "#f6f5f1",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        // Pyodide (~14 MB) is cached the first time the transfer test opens, not at install.
        globIgnores: ["pyodide/**"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/pyodide/"),
            handler: "CacheFirst",
            options: { cacheName: "pyodide", expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
  // Pyodide loads its own runtime files at run time; don't pre-bundle it.
  optimizeDeps: { exclude: ["pyodide"] },
  worker: { format: "es" },
  server: { host: true },
});
