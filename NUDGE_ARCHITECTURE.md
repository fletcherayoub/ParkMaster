# Nudge — Technical Architecture (Expo / React Native)

A build-ready architecture for the "Nudge" mobile game concept, designed to slot into an existing Expo Router scaffold (e.g. the `create-expo-app` structure with `app/`, `src/`, `assets/`).

---

## 1. Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Expo (SDK 52+), React Native, TypeScript | Matches existing scaffold, OTA updates via EAS Update for fast iteration |
| Rendering | `@shopify/react-native-skia` | GPU-accelerated 2D canvas, draws thousands of track segments/particles at 60fps even on low-end Android; avoids View-tree overhead of plain RN components |
| Physics | Custom lightweight physics (NOT Matter.js/Box2D) | The game only needs 1D lateral momentum + gravity along a spline path — a full physics engine is overkill and hurts low-end perf. A ~150-line custom integrator is faster and more predictable/tunable for "game feel" |
| Animation loop | Skia's `useFrameCallback` / `runOnJS` + Reanimated 3 worklets | Runs the simulation on the UI thread via worklets so JS-thread hitches (ads loading, analytics) never drop frames |
| State management | Zustand | Minimal boilerplate, works cleanly with worklets/refs, no context re-render cost |
| Local persistence | `expo-sqlite` (or `MMKV` via `react-native-mmkv`) | MMKV preferred for speed — coins, skins, streaks, best scores read/written every frame-adjacent event |
| Audio | `expo-av` with pre-loaded short sample pool | Pitch-shift the charge tone in real time by adjusting playback rate instead of loading many samples |
| Ads | `react-native-google-mobile-ads` | Rewarded video for revives/coin-doubling |
| IAP | `react-native-iap` (or `expo-in-app-purchases` if staying fully managed) | Cosmetic packs, remove-ads, coin bundles |
| Leaderboards/cloud | Supabase (Postgres + Auth + Edge Functions) or Firebase | Lightweight backend for global leaderboards, daily seed distribution, anti-cheat score validation |
| Analytics | Expo + PostHog or Amplitude | Funnel/retention tracking for live-ops tuning |
| Navigation | Expo Router (file-based, already in scaffold) | Home/game screen is the app root — no nav overhead on launch |

---

## 2. Project Structure

Fits directly into the existing `ParkMaster`-style Expo scaffold:

```
app/                          # Expo Router screens (thin, mostly re-exports)
  _layout.tsx                 # Root layout: loads fonts, sets up stores, splash
  index.tsx                   # Game screen — app opens directly into gameplay
  shop.tsx                    # Cosmetics store
  leaderboard.tsx
  missions.tsx
  settings.tsx

src/
  engine/
    physics.ts                # Custom integrator: charge, release, momentum, collision
    trackGenerator.ts          # Seeded procedural segment generator
    segments/                 # Library of track segment definitions (JSON/TS objects)
      straight.ts
      chicane.ts
      gate.ts
      boost.ts
      narrow.ts
    collision.ts               # Broad/narrow-phase collision vs track bounds + obstacles
    difficultyCurve.ts          # Maps distance/time -> segment weight table

  render/
    GameCanvas.tsx             # Skia <Canvas> root, draws track + ball + particles
    Ball.tsx
    TrackSegment.tsx
    ParticleTrail.tsx
    HUD.tsx                    # Score/coins/streak overlay (plain RN Views, top bar only)

  state/
    useRunStore.ts             # Zustand: current run (score, coins, distance, alive)
    usePlayerStore.ts          # Zustand + MMKV persistence: coins, skins, streak, stats
    useSettingsStore.ts

  audio/
    soundManager.ts            # Preload pool, pitch-shift on charge, play on release/coin/death

  monetization/
    ads.ts                     # Rewarded ad wrapper (load/show/fallback)
    iap.ts                     # Purchase flow, receipt validation, restore purchases

  backend/
    supabaseClient.ts
    leaderboard.ts             # Submit/fetch scores, daily seed fetch
    dailyReward.ts

  data/
    skins.ts                   # Cosmetic catalog (id, cost, unlock condition)
    missions.ts                # Mission templates (daily/weekly)
    achievements.ts

  utils/
    rng.ts                     # Seeded PRNG (mulberry32 or similar) for deterministic runs
    haptics.ts

assets/
  sounds/
  sprites/                     # SVG-sourced flat vector art, exported as optimized PNG/WebP
  fonts/
```

---

## 3. Core Mechanic: Charge / Release Loop

The entire input surface is a single `Pressable`/`GestureDetector` covering the bottom ~40% of the screen.

```ts
// src/engine/physics.ts (simplified)
type BallState = {
  lateralPos: number;     // position across track width, -1..1
  velocity: number;
  chargeStartTime: number | null;
  chargeAmount: number;   // 0..1, grows while held
};

const MAX_CHARGE_MS = 650;      // full charge caps out — prevents "hold forever" degenerate strategy
const RELEASE_FORCE_CURVE = (t: number) => Math.pow(t, 1.6); // non-linear: rewards precise timing over max-holding

function onPressIn(state: BallState, now: number) {
  state.chargeStartTime = now;
}

function onFrame(state: BallState, now: number, dt: number) {
  if (state.chargeStartTime != null) {
    const held = Math.min(now - state.chargeStartTime, MAX_CHARGE_MS);
    state.chargeAmount = held / MAX_CHARGE_MS;
  }
  // forward momentum along track spline is constant/ramping regardless of charge
  // lateral velocity decays each frame (friction), pulling ball toward whichever
  // side the current track segment biases it (creates the "drift" tension)
}

function onPressOut(state: BallState) {
  const force = RELEASE_FORCE_CURVE(state.chargeAmount);
  state.velocity += force * NUDGE_DIRECTION_SIGN; // direction alternates or is contextual to segment
  state.chargeStartTime = null;
  state.chargeAmount = 0;
}
```

Key design lever: **`RELEASE_FORCE_CURVE` is non-linear**, so the skill ceiling comes from releasing at the *right* moment, not just holding longest — this is what separates "easy to learn" from "hard to master."

---

## 4. Procedural Track Generation

Tracks are assembled from a **segment library** rather than hand-built levels, which is how the game scales to "thousands of levels / endless" with near-zero content-authoring cost.

```ts
// src/engine/trackGenerator.ts (simplified)
type Segment = {
  type: 'straight' | 'chicane' | 'gate' | 'boost' | 'narrow';
  length: number;
  difficulty: number;       // 0..1, used for weighted selection
  build: (rng: RNG) => SegmentGeometry; // parametrized so same type never looks identical
};

function nextSegment(distanceTraveled: number, rng: RNG): Segment {
  const difficultyTarget = difficultyCurve(distanceTraveled); // ramps 0 -> 1 over first ~2000 units, then oscillates
  const candidates = SEGMENT_LIBRARY.filter(s =>
    Math.abs(s.difficulty - difficultyTarget) < 0.25
  );
  return weightedPick(candidates, rng);
}
```

- **Seeded runs**: daily/weekly "Challenge Track" mode uses a fixed daily seed (fetched from backend) so every player faces an identical track — enables fair global leaderboards without needing to store full level geometry server-side (just the seed + generator version).
- **Endless mode**: uses `Date.now()`-seeded RNG, difficulty oscillates with a slow upward trend so runs never feel "solved."
- **Anti-repetition**: track the last N segment types and down-weight immediate repeats.

---

## 5. Rendering Approach (Performance-First)

- Render the track as a single Skia `Path` per visible chunk (not per-obstacle Views) — drastically reduces draw calls.
- Only build/mount segments within a scrolling window (~3 segments ahead, 1 behind); recycle geometry objects rather than allocating per-frame (avoids GC pauses that cause jank on low-end Android).
- Ball, trail, and particles are drawn in the same Skia canvas as the track — one composited surface, no layered RN views.
- Cap particle count adaptively: detect frame time via `useFrameCallback`, throttle particle emission if average frame time exceeds ~18ms (targets stable 60fps over peak fidelity).

---

## 6. State & Persistence

```ts
// src/state/usePlayerStore.ts
interface PlayerState {
  coins: number;
  gems: number;
  ownedSkins: string[];
  equippedSkin: string;
  bestScore: number;
  streakDays: number;
  lastPlayedDate: string;
  missionsProgress: Record<string, number>;
}
```

- Persisted via MMKV (synchronous, fast — safe to write every run-end without perceptible lag).
- Run-in-progress state (`useRunStore`) is ephemeral, reset each run, never persisted mid-run (offline-safe, no partial-save corruption).
- **Offline play**: core loop, cosmetics already owned, and local best-score all work with zero network. Only leaderboard submission, daily seed fetch, and ad/IAP require connectivity — wrap those in try/catch with silent local queuing (submit leaderboard score on next connect).

---

## 7. Monetization Hooks

| Trigger | Mechanism | Guardrail |
|---|---|---|
| Run ends | Offer "Revive" via rewarded ad | Max 1 revive/run; 2nd+ revive costs escalating coins instead of ad, prevents ad-fatigue |
| Run ends | "Double coins" rewarded ad | Always optional, never blocks retry |
| Shop | Cosmetic IAP (skins, trails) | Zero gameplay effect — verified in physics.ts, skins only swap sprite/texture, never hitbox or force curves |
| Interstitial | Every ~4th retry, capped | Frequency-capped server-side to avoid churn-driving over-monetization |

---

## 8. Suggested Build Order (Milestones)

1. **Prototype (1–2 weeks)**: charge/release physics + single infinite straight track, no art — validate "feel" first.
2. **Procedural generation + 5 segment types** (1 week).
3. **Skia rendering pass + real art** (1–2 weeks).
4. **Meta systems**: coins, shop, MMKV persistence (1 week).
5. **Daily rewards, missions, achievements** (1 week).
6. **Backend**: Supabase leaderboard + daily seed (1 week).
7. **Monetization**: ads + IAP integration (1 week).
8. **Polish/perf pass on low-end Android device** (ongoing) — test on something like a Samsung A-series or Android Go device, not just simulator.

Total: roughly **8–10 weeks** for a single strong RN/Expo developer to reach soft-launch quality, matching the earlier "4/10 difficulty" estimate.

---

## 9. Notes on Fitting the Existing `ParkMaster` Scaffold

Since the current repo is a fresh `create-expo-app` template with Expo Router's default `app/` structure:
- Run `npm run reset-project` first to clear the example routes.
- Drop in the `src/` tree above alongside the existing `app/`, `assets/`, `scripts/` folders.
- Update `app.json` with the new app name/slug/icon once branding is finalized, and add the Skia + Reanimated config plugins.
- Add `expo-dev-client` early, since Skia and native ad/IAP modules require a custom dev build (not available in plain Expo Go).
