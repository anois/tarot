# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **pure-frontend, no-backend** 3D tarot divination web app (Vite + React 19 + TypeScript). Users bring their own LLM key (**BYOK**) and the browser calls the model API directly. UI and interpretations are Chinese-first.

## Commands

```bash
pnpm dev          # dev server (note: it commonly lands on :5174 if 5173 is taken)
pnpm build        # tsc -b (typecheck) + vite build  — run this to verify types
pnpm lint         # eslint (flat config, eslint.config.js)
pnpm test         # vitest run (all unit tests)
pnpm test:watch   # vitest watch
pnpm format       # prettier
pnpm preview      # preview the production build

# run a single test file / filter by name:
pnpm vitest run src/mechanics/mechanics.test.ts
pnpm vitest run -t "Fisher-Yates"

node scripts/fetch-deck.mjs   # (re)download the 78 RWS card images into public/deck/
```

Toolchain notes:
- **Vite is pinned to 7** on purpose — Vite 8's rolldown native binding failed to install here. Don't bump to 8 without checking.
- **Tailwind v4** via the `@tailwindcss/vite` plugin; theme tokens live in `@theme {}` inside `src/index.css` (no `tailwind.config`). Custom color utilities like `text-gold-300`, `bg-night-800` come from those tokens.
- **Vitest default environment is `node`** (jsdom 29 has a Node-21 ESM conflict). Pure-logic tests run in node; a React component test must opt in with a top-of-file `// @vitest-environment jsdom` pragma. `src/test/setup.ts` registers jest-dom matchers + `fake-indexeddb/auto`.
- **eslint-plugin-react-hooks v7 is strict**: it errors on `setState` inside `useEffect` and on reading a ref's `.current` during render. The pattern here is plain `useState` set only in event handlers (see `CardDetailPanel`), and deriving initial state in the `useState` initializer rather than a sync effect.

## Architecture (the big picture)

### Single source of truth: the divination store
`src/features/divination/divination.store.ts` is a Zustand store holding the whole reading flow as a phase machine: `idle → shuffling → picking → revealing → done`, plus `turns`/`streaming` for interpretation. **The 3D layer renders from this store and emits events back into it — it holds no divination truth.** A dev-only `window.__divination` handle (gated by `import.meta.env.DEV`) exposes the store for manual/automated testing in the browser.

### The 3D deck is ONE unified component
`src/features/deck3d/Deck.tsx` drives the entire card lifecycle with one `useSprings` set of meshes (mesh `i` shows `deckOrder[i]`): stack → shuffle choreography → **coverflow browse** → pick → **fly into spread slot (face-down)** → flip face-up in place. There is intentionally NO separate "picking deck" vs "reveal" component — the card you pick is the same mesh that flips, which is why it must be unified. Key pieces:
- `layout.ts` — all transforms as pure functions (`stackTransform`, `coverflowTransform`, `slotTransform`, `discardTransform`) plus the spread-board sizing (`spreadPlane`, `spreadCardScale`, `BOARD_OFFSET_Y`). The board sits in the upper view; the coverflow ribbon along the bottom (`RIBBON_Y`).
- Coverflow focus (`centered`) is scrubbed from `state.pointer.x` inside `useFrame` (throttled to integer steps); clicking an invisible catcher plane picks the centered card.
- `useDeckFronts.ts` — imperatively lazy-loads picked cards' image front textures for the classic face (NOT Suspense, so streaming a face never re-mounts/kills animations).
- `Card.tsx` — a thin box with a 6-material array; **reversed = `rotation.z += π`** (same texture, rotated 180°), **face-down = `rotation.y = π`**, flip = animate `rotation.y → 0`.
- **Skins are procedural** (`skins.ts`, canvas textures, cached): 4 card backs, 4 tablecloths, and an alternate **minimal** card face drawn per card from its correspondences. There is NO card-back image asset (`textures.ts` was removed). The user picks `deckBack` / `cardFace` / `tableCloth` live; choices persist in `store/prefs.store.ts`.
- `Table.tsx` is the tablecloth backdrop that **receives card drop-shadows** — `Scene.tsx` has the shadow-casting `directionalLight` (cards `castShadow`), a pointer-parallax `ParallaxRig`, and ambient drei `<Sparkles>`; `Deck.tsx` pulses a `BurstRing` where a picked card lands.
- Reduced motion (`src/lib/useReducedMotion.ts`) shortens the shuffle and disables parallax; WebGL/render failures are caught by an `ErrorBoundary` around `<Scene>` in `ReadingRoute`.

### Normalized [0,1] spread coordinates — shared by 2D and 3D
A spread position has `x,y` in `[0,1]` denoting the card **center**, plus `rotation` (deg) and `z` (paint order). This single convention is consumed by three renderers that must stay consistent: `src/spreads/SpreadPreview.tsx` (DOM 2D, used in lists/history/editor), `deck3d/layout.ts#slotTransform` (3D), and `features/spreads/editor` (the visual drag editor writes normalized coords). Spreads are validated by a Zod schema **with cross-field invariants** (`src/spreads/schema.ts`: `cardCount === positions.length`, unique ids, indices form `1..n`, `x/y ∈ [0,1]`).

### LLM client (BYOK, OpenAI-compatible)
`src/llm/client.ts` builds an OpenAI-compatible request per provider preset (`presets.ts`) and parses streaming SSE. **DeepSeek is the verified browser-direct default**; OpenRouter is the wildcard-CORS fallback; OpenAI-direct is browser-blocked (do not default to it); Anthropic-native needs the `anthropic-dangerous-direct-browser-access` header and a separate SSE parser. Two SSE parsers in `src/llm/sse/` (OpenAI-style `data:` chunks vs Anthropic named events) both yield a unified `StreamEvent`. Errors are classified (`errors.ts`) — a bare `TypeError` from fetch is treated as a CORS failure with a "switch to OpenRouter" message.

Key handling (`store/llmConfig.store.ts` + `llm/keyStorage.ts`): the API key is **in memory by default**; persisting to session/localStorage is an explicit opt-in (`remember`). `llm/devKey.ts` pre-fills the key from `.env` (`VITE_DEV_LLM_*`) but ONLY under `import.meta.env.DEV` — it is dead-code-eliminated from production builds, so no key ships in the bundle. **Share links** (`llm/shareLink.ts`) encode config in the URL **fragment** (`#cfg=`, never sent to servers); on load `App.tsx` applies it (key → sessionStorage) and strips the hash.

### Prompt assembly
`src/prompt/assemble.ts` builds a structured context block (question + per-position label/meaning + each drawn card's name/orientation + the orientation-appropriate meanings from the dataset) and selects a system prompt per template (`templates.ts`). All prompts force Simplified-Chinese output. Templates: `structured` / `narrative` / `quick`, plus `overall` (whole-board synthesis — `buildStatsBlock` injects `reading/boardStats.ts` features: element distribution, upright/reversed ratio, Major-Arcana density, court count, dominant/absent element) and `deepdive` (follow-ups + the per-card deep-dive). Deep-dives reuse the same context plus prior `turns` as conversation history and forbid re-drawing. `useInterpret.ts` orchestrates streaming into the store, threads `focusPositionId` onto turns (so the card panel shows its own card's result), exposes `interpretCard(...)`, and auto-saves the `Reading` to IndexedDB after each turn.

### Card detail panel
Clicking a revealed card (done phase) sets `selectedPositionId` in the store; `features/divination/components/CardDetailPanel.tsx` (a drawer) shows that card's reference data + a position+question-aware LLM button (`interpretCard`). Reference data = `src/deck/correspondences.ts` (authored element + standard Golden-Dawn astrology incl. pip decans + numerology) merged with `src/deck/data/card-lore.json` (each card's Chinese symbolism + story). The detail panel always shows the canonical RWS art (`cardImageUrl`) regardless of the chosen face skin.

### Data layers (pure, well-tested)
- `src/deck/` — 78-card identities (`cards.ts`, programmatically built) joined to CC0 meanings (`meanings.ts`, from `dariusk/corpora`; note it labels the coins suit `coins` → normalized to `pentacles`). `deck.ts` throws if any card lacks a meaning.
- `src/mechanics/` — crypto-grade randomness only: `rng.ts` (`crypto.getRandomValues` + rejection sampling; a seedable `mulberry32` for tests), Durstenfeld `shuffle.ts`, and `draw.ts` (reversed = an **independent per-card coin**, decided after the shuffle). Never use `Math.random` or `array.sort` for fairness here.
- `src/db/db.ts` — Dexie; `spreads` and `readings` tables. All Dexie access goes through the repos (`spreads/repo.ts`, `reading/repo.ts`). History/spreads live in IndexedDB (not localStorage) because they can carry data-URL background images.

### Module boundaries to respect
- Only `features/deck3d/**` imports `three`/`@react-three/*` (keeps the heavy 3D bundle in the lazy reading-route chunk). From non-3D code (spread preview, history, card panel) use the three-free `@/deck/images.ts#cardImageUrl`.
- `vite.config.ts` `manualChunks` isolates `three` and `react`; everything else is left to Rollup so markdown/zod/dexie co-locate with the lazy routes that use them. The `three` chunk (~950KB) is intentionally large and lazy — the build's size warning is silenced via `chunkSizeWarningLimit`.
- Untrusted strings (LLM markdown via `ui/Markdown.tsx`, imported spread fields, uploaded images via `lib/image-sanitize.ts`) are rendered as React children / sanitized — never raw HTML.

## Assets & licensing caveat

`public/deck/` holds the public-domain Rider-Waite-Smith deck (currently from `metabismuth/tarot-json`). The image↔`imageKey` mapping is stable (`major_00.jpg`, `<suit>_<rank>.jpg`), so the art is a drop-in replacement. **Before public deployment**, verify the scans are the 1909 edition (not the still-copyrighted 1971 US Games recolor) or swap to a CC0 set — see `public/deck/LICENSE.txt`. "Rider-Waite" is a US Games trademark; don't brand the app as that mark.

## Deployment

`.github/workflows/deploy.yml` deploys two targets on push to `main` (see `docs/deploy.md`):
- **GitHub Pages** — <https://anois.github.io/tarot/>. Project sites live under `/<repo>/`, so CI builds with `BASE_PATH=/<repo>/` → Vite `base`. `vite.config.ts`'s `spaFallback` plugin emits `dist/404.html` (a copy of `index.html`) for deep-link SPA fallback, and `App.tsx` sets BrowserRouter `basename` from `import.meta.env.BASE_URL`.
- **Aliyun OSS** (CN-domestic mirror, opt-in via repo variable `ENABLE_OSS_DEPLOY=true` + `ALIYUN_*` secrets) — builds with `BASE_PATH=/` (bucket root).

**Keep `BrowserRouter` (NOT `HashRouter`)** — share links use the URL `#fragment`, which a hash router would clobber.

## Security model

Pure-frontend BYOK means any key the browser uses is visible to the user/page — this is acceptable only because each user supplies their own key. `public/_headers` defines a production CSP (`connect-src` limited to the chosen LLM providers) — but note it's only honored by Netlify/Cloudflare Pages; **GitHub Pages and OSS ignore it**, so the CSP is not enforced on the current hosts.
