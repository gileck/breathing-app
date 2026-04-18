# Breathing App — Implementation Plan

Based on the mockup (extracted to `design-docs/mockup-extracted/2-app.jsx`) and the v2 brainstorm.

The mockup shows **three screens**: Saved Exercises (list), Pattern Builder (steppers + BPM), and Session (live tuning). The builder has a save-sheet modal variant.

## Core model

**Exercise** is the first-class entity:

```ts
// src/apis/project/exercises/types.ts
type Phase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

type Pattern = { inhale: number; holdIn: number; exhale: number; holdOut: number }; // seconds

type Exercise = {
  id: string;
  name: string;
  pattern: Pattern;
  pace: number;              // tempo multiplier, 0.5–2.0, default 1.0
  length:                    // session stop condition
    | { kind: 'minutes'; value: number }
    | { kind: 'cycles'; value: number }
    | { kind: 'open' };
  audio?: AudioOverrides;    // optional per-exercise overrides
  haptics?: HapticsOverrides;
  notes?: string;
  favorite: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type SessionLog = {
  id: string;
  exerciseId: string;
  startedAt: string;
  endedAt: string;
  cycles: number;
  startingPattern: Pattern;
  endingPattern: Pattern;    // may differ if user live-tuned
  startingPace: number;
  endingPace: number;
};
```

Decisions locked in from the brainstorm:
- `pace` = global tempo multiplier. The builder slider and the session slider write the same field.
- Effective phase seconds = `pattern[phase] / pace`. Render BPM from total effective seconds.
- Live tuning changes apply on the next cycle boundary, not mid-phase.

## Storage

Client-only for v1 — no server APIs. Persist with Zustand + localStorage.

- `src/client/features/project/exercises/store.ts` — exercises CRUD + favorites + last-used ordering.
- `src/client/features/project/session-history/store.ts` — append-only session logs.
- `src/client/features/project/breathing-settings/store.ts` — app-wide audio/haptics/visual defaults.

Seed the exercises store with 3–4 starters on first load (box 4-4-4-4, 4-7-8, coherent 5-0-5-0, physiological sigh).

If we later want cross-device sync, wrap each store with an `/api/process/exercises.*` mutation set; the store shape already matches the API shape so the swap is mechanical. Do not build this in v1.

## Routes

Add to `src/client/routes/index.project.ts`. Per the mockup, library and home are the same screen — the pinned/last-used exercise lives as the card at the top of the list.

```
'/'              → Library         (pinned card + list, replaces existing Home)
'/exercise/new'  → ExerciseEditor  (create mode)
'/exercise/:id'  → ExerciseEditor  (edit mode)
'/session/:id'   → Session         (fullScreen: true)
'/session/complete/:logId' → SessionComplete
'/history'       → History
'/settings/breathing' → BreathingSettings
```

Wire `/`, `/history` into `NavLinks.tsx` `navItems`.

## Feature/route layout

Follow the Todos pattern:

```
src/client/routes/project/
  Home/                   # big Start button + favorites row
  Library/                # list, sort/filter, swipe actions
  ExerciseEditor/         # builder + save (same screen for new & edit)
    components/
      PhaseStepper.tsx
      PacePicker.tsx
      LengthPicker.tsx
      MiniPreview.tsx     # animated shape playing the pattern at current pace
  Session/
    components/
      BreathShape.tsx     # the animated circle / sine
      TempoSlider.tsx
      PhaseLabel.tsx      # tappable ±1s
    engine.ts             # pure state machine: phase, cycle, tick
    hooks.ts              # binds engine to the exercise store + rAF
  SessionComplete/
  History/
  BreathingSettings/

src/client/features/project/
  exercises/     { store.ts, hooks.ts, seed.ts, types.ts (re-export), index.ts }
  session-history/
  breathing-settings/
  breath-engine/ # reusable pure logic shared between MiniPreview and Session
```

`breath-engine/` is pure TS (no React) — one reducer + a `tick(now)` function. Both the mini preview and the session screen drive it. This is how we guarantee "preview feels like the real thing."

## Session engine sketch

```ts
// breath-engine/engine.ts
type EngineState = {
  phase: Phase;
  phaseElapsedMs: number;
  cycle: number;
  pattern: Pattern;   // current (possibly tuned) pattern
  pace: number;       // current (possibly tuned) pace
  pendingPattern?: Pattern; // applied at next cycle boundary
  pendingPace?: number;
};
```

- Drive from `requestAnimationFrame` in a hook; don't use `setInterval` (drifts + throttled on bg tabs).
- On phase transition, emit a `PhaseChange` event → audio cue + haptic pulse.
- On cycle boundary, if pending tuning exists, swap it in. Emit a "pattern updated" toast/pulse.
- Pause on tab blur (optional setting). Stop on unmount.

## Screens in detail (from the mockup)

### Library (`/`)
- Header: title + `+` button (→ `/exercise/new`).
- Pinned card (last-used or explicit pin): name, pattern string (`4–2–6–2`), bpm, big `▶ Start` button. Tinted with the accent color.
- Section header `ALL EXERCISES`.
- Row cards: colored dot (accent if active), name, 4-segment mini-bar (one segment per phase, width ∝ seconds), pattern string + bpm, relative last-used label, chevron. Tap → opens editor. Long-press/swipe → edit/duplicate/delete.

### Exercise editor (`/exercise/new` | `/exercise/:id`)
- Header: "Pattern Builder" title + `▶ Start` button (starts an unsaved session from current pattern).
- Big BPM readout (`60 / total`), 4-segment timeline bar sized by phase seconds, pattern string `I–H–E–H`.
- Four phase rows, each: colored left swatch, label ("Inhale"), seconds line (`4s` or `skip` when 0), stepper `−/value/+` (44×44 buttons, value cell 48×44, mono font). Clamp 0–30.
- Bottom actions: `Save` (opens bottom-sheet) + `▶ Start Session` (primary, accent fill).

### Save sheet (bottom sheet, opens from editor)
- Backdrop: `oklch(0.10 ... / 0.7)` + `backdrop-blur`.
- Drag handle, title "Save exercise", subhead with pattern + bpm.
- Name input (focus ring in accent).
- Preset name chips (Morning / Pre-sleep / Focus / Anxiety reset) — tap to fill.
- Cancel + Save exercise buttons.

### Session (`/session/:id`)
- Dark radial background with subtle blue haze at center.
- Top row: cycle counter `CYCLE · 07 / 24` (mono, tabular-nums), close X (tap-to-reveal — hide by default, show on tap).
- Pattern readout above the shape: mono, `4 · 7 · 8 · 0`.
- Phase label: "Breathe in…" / "Hold" / "Breathe out…" / "Rest".
- BreathShape (see below) centered.
- PhaseRow chips below shape: four chips, active one styled with accent border + tint. When the `showNudge` setting is on, the active chip gets `＋`/`－` buttons above/below for ±1s adjustments to that phase only.
- TempoStepper on right edge: two large buttons (Fast ▲ top, Slow ▼ bottom), readout `1.00×` between them, `TEMPO` caption. Disabled when at 0.6 / 1.4 bounds.
- Stats row at bottom: Elapsed / Rate / Tempo (Tempo highlights accent when ≠ 1.0).
- "UPDATES NEXT CYCLE" pill appears above stats when pending tuning is queued.

### Session complete (`/session/complete/:logId`)
- Cycles, duration, starting pattern → ending tuned pattern.
- "Save tuned version as new exercise?" prompt — opens the same save-sheet component.

### Breath shape variants
All accept `{ scale: 0–1, phase, countdown }`:
- **Orb** (default): radial-gradient disc scaled by `scale` (inhale→1.0, holdIn→1.0, exhale→0.55, holdOut→0.55). Two static dashed halo rings as guides. Countdown number inside.
- **Ring**: SVG circle with stroke-dashoffset animated by cycle progress. Inner disc scales like orb. Countdown centered.
- **Wave**: SVG sine path, amplitude = `44 * scale`. Countdown beneath.

In the mockup these are CSS transitions (`transition: width .4s ease`). For the real app, drive from the engine's `requestAnimationFrame` tick with eased interpolation over the phase's duration so preview and session are truly the same animation.

## UI building blocks

All via shadcn + semantic tokens. New pieces:

- `BreathShape` — picks Orb / Ring / Wave based on settings. Driven by the engine's current state (phase, elapsed ratio, countdown). Reused in MiniPreview and Session.
- `PhaseStepper` — `−/value/+` row, 44px buttons, mono value cell, 0–30 clamp.
- `TempoStepper` — vertical Fast/Slow buttons with readout between. Horizontal variant for the editor. Writes to `pendingPace` (applied at cycle boundary) in Session, directly to `pace` in Editor.
- `PhaseRow` — four chips showing current durations at current pace; active chip highlighted; optional `＋/－` nudge buttons on active chip per setting.
- `TimelineBar` — horizontal 4-segment bar sized by phase seconds. Reused in builder and library cards (smaller variant).
- `PatternString` — `4–7–8–0` with configurable separator. Mono.
- `BpmReadout` — large or small; computed `60 / total`, or `—` when total is 0.
- `SaveSheet` — shadcn `Sheet` with side="bottom", name input, preset chips, cancel/save.
- Swipe-to-edit/delete on library cards — shadcn dialog for confirm delete.

Touch targets ≥44px, mobile-first, `pb-20` on scrolling screens.

## Theming

The mockup uses hardcoded `oklch(...)` inline. For the real app, extend the theme with tokens and never inline oklch:

```css
/* src/styles/theme (or the project's theme file) */
--phase-inhale:  oklch(0.78 0.09 230);  /* blue */
--phase-hold-in: oklch(0.78 0.07 180);  /* teal */
--phase-exhale:  oklch(0.75 0.09 260);  /* violet */
--phase-hold-out:oklch(0.65 0.05 280);  /* deeper violet */

--breath-accent:       var(--phase-inhale);
--breath-accent-soft:  oklch(0.78 0.09 230 / 0.18);
--breath-session-bg:   oklch(0.14 0.005 80);
--breath-session-haze: radial-gradient(ellipse 70% 55% at 50% 44%,
                        oklch(0.26 0.04 230 / 0.55), var(--breath-session-bg) 70%);
```

Tailwind class additions: `bg-phase-inhale`, `text-breath-accent`, `bg-breath-session-haze`, etc. Session screen forces dark regardless of app theme.

## Build order (suggested task breakdown)

1. **Types + store + seed.** Exercises store with CRUD, favorites, last-used. No UI.
2. **Library + Home.** List cards, sort, favorite, delete. Home surfaces last-used with Start.
3. **Exercise editor (builder).** PhaseStepper, PacePicker, LengthPicker, notes. Save / Save As / Delete. No live preview yet.
4. **breath-engine pure module + tests.** Reducer for phase/cycle, pending-tuning merge at cycle boundary, tick.
5. **MiniPreview** in the editor, driven by the engine.
6. **Session screen.** BreathShape, phase label, cycle counter, tempo slider, tappable phase ±1s. Pause/stop.
7. **Audio + haptics.** App-wide defaults store + per-exercise overrides. Tone/voice/ambient bus with separate volumes. `navigator.vibrate` for haptics (graceful no-op on desktop).
8. **Session complete + history.** Log the session, prompt "Save tuned version as new exercise?" when pattern or pace changed.
9. **Settings screen.** Theme, shape, motion intensity, default session length, audio/haptic defaults.
10. **Polish.** Dark mode pass, animation timing, empty states, error states, QA on iOS PWA (visualViewport), `yarn checks`.

Tasks 1–3 ship a usable (silent, no-session) library. Task 6 is the first demoable end-to-end.

## Open questions to resolve before starting

- **Audio assets.** Synthesize tones with Web Audio (no files), or ship ambient loops? Synthesis is simpler for v1.
- **"Open-ended" session length.** Allow it, or force minutes/cycles? Brainstorm implies required — default to minutes=5.
- **Favorites vs pinned.** Brainstorm uses both words — treat as the same flag (`favorite: boolean`) for v1.
- **Tuned-pattern capture UX.** Auto-prompt on complete, or a subtle "Save as new" button? Start with auto-prompt, skippable.
- **History retention.** Cap at N sessions (e.g., 200) to keep localStorage bounded.

## Out of scope for v1

- Multi-device sync / accounts beyond what the template already provides.
- Sharing exercises.
- Programs/streaks/goals.
- Background execution / lock-screen controls.
