# ADR 0001 · Cross-platform Technology Stack

| | |
|---|---|
| **Status** | Accepted (for the prototype and MVP) |
| **Date** | 2026-10-03 |
| **Decision** | Web-first TypeScript app (React + HTML/SVG boards + PixiJS effects layer), shipped to iOS and Android with Capacitor |
| **Revisit when** | See §6 |

---

## 1. Context

Vicoding must run on **web and mobile (iOS, Android)** from day one. The product is roughly:

- **70% learning tool:** a drag-and-drop/tap-to-place battle-plan editor, code panels and editors, running real Python/JavaScript in later stages, lots of text (stories, explanations, code), accessibility.
- **30% game feel:** animated boards (arrays, grids, trees, graphs), characters, effects (sparks, ripples, the Ogre).

Structurally Vicoding is a **turn-based board game**: a board (array/grid/graph), pieces (pointers, clones), turns (one step of the run) and a move history (the recorded run, which can be scrubbed and rewound). Nothing needs real-time physics at 60 fps; motion is short animations between discrete states.

## 2. What comparable products use

| Group | Examples | Typical technology | Why |
|---|---|---|---|
| Large online board-game platforms | Lichess, Chess.com, Board Game Arena, OGS (online Go) | **Web-first** (TypeScript/JavaScript, boards built from HTML/CSS/SVG elements). Mobile via native apps, Flutter (Lichess's newer app) or wrapped web | Reach: instant play from a link on any device; turn-based boards don't need a game engine |
| Premium board/card game adaptations | Ticket to Ride, Carcassonne, Catan Universe, Wingspan, Hearthstone, Marvel Snap, MTG Arena | **Unity** (C#) | Heavy visual polish, 3D, console/PC/mobile store releases; weak or absent web versions |
| Coding & learning products | Scratch, Blockly (Code.org), CodeCombat, Brilliant, Duolingo (web app + native; Rive for character animation) | **Web technology**, sometimes plus native apps | Block editors, code editors, running code and heavy text are native to the web |

Vicoding's hard problems (block editor, code editor, running code, text, accessibility, instant access from a link) are the ones the second and third groups solve with web technology. Unity's strengths only cover the smaller "game feel" part.

## 3. Options considered

| Option | Pros | Cons | Result |
|---|---|---|---|
| **A. Web (React + SVG/DOM boards + PixiJS) + Capacitor** | One TypeScript codebase for web, iOS, Android; code editors and in-browser code execution work out of the box; instant web access; content updates without store releases | Less "native" feel; must design touch interactions and performance budgets carefully | ✅ **Chosen** |
| B. React Native / Expo (+ Skia) | Native feel on mobile | Code editor and Python execution still need a WebView → two rendering stacks; weaker web version | Rejected for now |
| C. Flutter | Excellent canvas, smooth mobile | Dart instead of TypeScript; code editing and code execution awkward; heavy web build | Rejected |
| D. Unity | Best-in-class effects and animation tooling | Large, slow web builds; weak at text/UI/code editing; overkill for 2D boards | Rejected |
| E. Godot | Free, light, good 2D | Same UI/code-editor weaknesses as Unity; limited web export | Rejected |

## 4. Decision

### 4.1 Stack
| Concern | Choice |
|---|---|
| Language | TypeScript everywhere |
| Monorepo & build | pnpm workspaces, Vite |
| UI | React, Zustand (state) |
| Boards (arrays, grids, trees, graphs) | **HTML/SVG elements** (crisp at any size, accessible, easy to style), the same approach as Lichess's board |
| Effects layer | **PixiJS v8** on top of the boards: particles, ripples, the Ogre, crumble effects |
| Characters | **Rive** (or Spine) animations, played on web and mobile from the same files |
| Plan editor drag & drop | dnd-kit, plus a tap-to-place mode for phones |
| Code editor | CodeMirror 6 (good mobile support; Monaco is poor on phones) |
| Running user code | JavaScript in a Web Worker; Python via **Pyodide**, lazy-loaded only on screens that need it |
| Mobile shell | **Capacitor** (iOS and Android), game bundled offline in the app, plus native touches (haptics, notifications) |
| Web distribution | Static hosting + installable PWA |
| Backend (post-prototype) | Supabase (auth, progress, leaderboards); not needed for the prototype |
| Testing | Vitest (engine unit tests), Playwright (end-to-end on web and mobile viewports) |

### 4.2 Architecture

```
vicoding/
├─ packages/
│  ├─ engine/     pure TypeScript, no UI: battle-plan language, interpreter,
│  │              event log (Battle Chronicle), operation counting, test waves,
│  │              counterexample search. Heavily unit-tested.
│  ├─ levels/     level definitions (JSON) + reference solutions + tests
│  ├─ codegen/    battle plan → Python / JavaScript code
│  ├─ board/      React + SVG board components (array, grid, tree, graph)
│  ├─ fx/         PixiJS effects layer driven by engine events
│  └─ ui/         plan editor, timeline, panels, screens
└─ apps/
   ├─ web/        Vite web app / PWA
   └─ mobile/     Capacitor shell → iOS / Android
```

**Key principle:** the `engine` package knows nothing about rendering or platforms. It emits **semantic events** (`agent.move`, `compare`, `container.put`…) that the board and effects layers turn into animation. If the rendering technology ever changes (e.g. to Unity or native), only `board`/`fx`/`ui` are rewritten, while the engine and levels stay.

## 5. Consequences

**Positive**
- One codebase and one team for three platforms.
- Players can try a level from a shared link with no install, which matters for growth and for playtests.
- New levels ship instantly (content is data), without app-store review.
- Accessibility (screen readers, keyboard, text log) is far easier with HTML/SVG boards.

**Negative / risks and mitigations**
| Risk | Mitigation |
|---|---|
| Plan editing on small phones is fiddly | Tap-to-place editor, plan as a bottom sheet; heavy building aimed at tablet/desktop, phones focused on watching, fixing, quizzes, reviews |
| Apple may reject "just a website" apps (App Store guideline 4.2) | Bundle the game offline in the app, add native features (haptics, notifications, offline progress) |
| Performance on older phones | Fixed animation budget, low-effects mode, large-input runs computed without animation |
| Pyodide is ~10 MB | Load only when a code-first screen needs it; cache afterwards; early stages use our own interpreter |
| Less native feel than React Native/Flutter | Native transitions via Capacitor plugins; revisit if retention data shows it matters (§6) |

## 6. Revisit this decision if…
- The vision shifts to **Hearthstone-level spectacle** (3D, console release) and web play stops mattering → consider Unity for the client, keeping the engine as a shared library or a port.
- Playtests show **mobile feel is hurting retention** → consider a native mobile client (Flutter like Lichess, or React Native) on top of the same engine and levels.
- Capacitor/WebView performance can't hold the animation budget on target devices.
