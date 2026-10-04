// Renders every app icon (web, Android, iOS) from one design.
// Usage: node scripts/render-icons.mjs   (from apps/web; uses Playwright's Chromium)
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "..");
const android = join(web, "../mobile/android/app/src/main/res");
const ios = join(web, "../mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset");

const BLUE = "#1e3a8a";
/** The glyph on a 512×512 canvas: four tiles, two pointers, a smile. */
const GLYPH = `
  <g fill="#f6f5f1">
    <rect x="96" y="268" width="64" height="64" rx="14"/>
    <rect x="178" y="268" width="64" height="64" rx="14"/>
    <rect x="260" y="268" width="64" height="64" rx="14"/>
    <rect x="342" y="268" width="64" height="64" rx="14"/>
  </g>
  <g fill="#fbbf24">
    <path d="M128 236 l-26 -40 h52 z"/>
    <path d="M374 236 l-26 -40 h52 z"/>
  </g>
  <path d="M150 380 q106 70 212 0" fill="none" stroke="#fbbf24" stroke-width="18" stroke-linecap="round"/>`;

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${body}</svg>`;
const ICONS = {
  rounded: svg(`<rect width="512" height="512" rx="112" fill="${BLUE}"/>${GLYPH}`),
  square: svg(`<rect width="512" height="512" fill="${BLUE}"/>${GLYPH}`),
  round: svg(`<circle cx="256" cy="256" r="256" fill="${BLUE}"/>${GLYPH}`),
  // Adaptive-icon foreground: the glyph alone, shrunk into the central safe zone (66 of 108 dp).
  foreground: svg(`<g transform="translate(256 256) scale(0.62) translate(-256 -278)">${GLYPH}</g>`),
};

const browser = await chromium.launch();
async function render(name, size, file) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0">${ICONS[name].replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`);
  mkdirSync(dirname(file), { recursive: true });
  await page.screenshot({ path: file, omitBackground: true });
  await page.close();
}

writeFileSync(join(web, "public/icon.svg"), ICONS.rounded + "\n");
await render("rounded", 192, join(web, "public/icon-192.png"));
await render("rounded", 512, join(web, "public/icon-512.png"));

// Android launcher icons, per density.
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [density, scale] of Object.entries(densities)) {
  await render("rounded", 48 * scale, join(android, `mipmap-${density}/ic_launcher.png`));
  await render("round", 48 * scale, join(android, `mipmap-${density}/ic_launcher_round.png`));
  await render("foreground", 108 * scale, join(android, `mipmap-${density}/ic_launcher_foreground.png`));
}
writeFileSync(
  join(android, "values/ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BLUE}</color>\n</resources>\n`,
);

// iOS: one 1024 px square; iOS applies its own rounded mask.
await render("square", 1024, join(ios, "AppIcon-512@2x.png"));

await browser.close();
console.log("Icons rendered.");
