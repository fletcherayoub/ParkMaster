# What's implemented

This branch adds a working core-loop implementation of "Nudge" on top of the
original Expo Router scaffold. It follows `NUDGE_ARCHITECTURE.md` (shared
separately) but is scoped to what's realistically verifiable without a device/
emulator in this environment.

## Done and type-checked
- `src/utils/rng.ts` — seeded PRNG (mulberry32) + daily-seed helper for fair Challenge Track leaderboards
- `src/engine/segments/*` — segment type definitions + a 5-type procedural segment library (straight, chicane, narrow, gate, boost)
- `src/engine/trackGenerator.ts` — rolling-window procedural track generator (endless + daily-seeded modes)
- `src/engine/physics.ts` — the core charge/release mechanic, non-linear release-force curve, collision vs track width
- `src/state/useRunStore.ts` — ephemeral per-run state (Zustand)
- `src/state/usePlayerStore.ts` — persisted player state via MMKV (coins, skins, streak, best score)
- `src/state/useDailyReward.ts` — daily streak reward claim hook
- `src/data/skins.ts` — cosmetic skin catalog
- `src/render/GameCanvas.tsx` — Skia canvas + gesture-driven physics loop
- `src/render/HUD.tsx`, `RetryOverlay.tsx` — UI overlays
- `src/app/index.tsx` — rewritten to boot directly into gameplay (no menu)
- `app.json` — added `expo-dev-client`, `react-native-reanimated`, `@shopify/react-native-skia` plugins
- `src/app/_layout.tsx` — wrapped in `GestureHandlerRootView`

`npx tsc --noEmit` passes clean except two pre-existing template errors
(CSS-module typings) that were present before this work and don't block
Metro bundling.

## Required before running on a device
1. **This needs a custom dev client — it will NOT run in plain Expo Go**, because `@shopify/react-native-skia` and `react-native-mmkv` are native modules.
   ```
   npx expo prebuild
   npx expo run:android   # or: npx expo run:ios
   ```
2. Test the charge/release "feel" on a real low-end Android device early — the tuning constants in `src/engine/physics.ts` (`PHYSICS_CONSTANTS`) will need hand-tuning by playtest, no formula substitutes for that.
3. `src/render/GameCanvas.tsx` currently hardcodes `SCREEN_W = 400` as a placeholder — swap for `useWindowDimensions()` before shipping.

## Not implemented (needs your accounts/credentials, so left as documented stubs)
- Rewarded ads (`react-native-google-mobile-ads`) — needs your AdMob app ID
- IAP (`react-native-iap`) — needs App Store Connect / Play Console product IDs
- Supabase/Firebase leaderboard backend — needs a project + schema
- Sound (`expo-av`) — needs actual audio assets
- Shop/leaderboard/missions screens — only the skin *data* and *store logic* (`unlockSkin`, `equipSkin`) exist; the screens themselves aren't built yet

These are the pieces that depend on decisions only you can make (which ad
network terms, which backend, what the audio should sound like), so I left
them as clearly marked TODOs rather than guessing.
