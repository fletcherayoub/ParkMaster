import { RNG } from '../../utils/rng';
import { SegmentDefinition, SegmentGeometry, SegmentObstacle } from './types';

function coinRow(rng: RNG, count: number): SegmentObstacle[] {
  const out: SegmentObstacle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ kind: 'coin', x: rng.float(-0.3, 0.3), t: (i + 1) / (count + 1) });
  }
  return out;
}

export const SEGMENT_LIBRARY: SegmentDefinition[] = [
  {
    kind: 'straight',
    difficulty: 0.05,
    weight: 3,
    build: (rng, difficulty): SegmentGeometry => ({
      kind: 'straight',
      length: rng.float(140, 220),
      widthStart: 1,
      widthEnd: 1,
      curveBias: rng.float(-0.15, 0.15),
      obstacles: rng.next() > 0.4 ? coinRow(rng, rng.int(2, 4)) : [],
    }),
  },
  {
    kind: 'chicane',
    difficulty: 0.35,
    weight: 3,
    build: (rng, difficulty): SegmentGeometry => {
      const sway = 0.4 + difficulty * 0.5;
      return {
        kind: 'chicane',
        length: rng.float(160, 260),
        widthStart: 1,
        widthEnd: 1,
        curveBias: rng.next() > 0.5 ? sway : -sway,
        obstacles: [
          { kind: 'wall', x: rng.float(-0.6, -0.2), t: 0.3 },
          { kind: 'wall', x: rng.float(0.2, 0.6), t: 0.7 },
          ...coinRow(rng, 2),
        ],
      };
    },
  },
  {
    kind: 'narrow',
    difficulty: 0.55,
    weight: 2.5,
    build: (rng, difficulty): SegmentGeometry => {
      const pinch = Math.max(0.35, 0.75 - difficulty * 0.4);
      return {
        kind: 'narrow',
        length: rng.float(120, 180),
        widthStart: 1,
        widthEnd: pinch,
        curveBias: rng.float(-0.2, 0.2),
        obstacles: coinRow(rng, 3), // near-miss reward: coins sit inside the pinch
      };
    },
  },
  {
    kind: 'gate',
    difficulty: 0.7,
    weight: 2,
    build: (rng, difficulty): SegmentGeometry => ({
      kind: 'gate',
      length: rng.float(150, 200),
      widthStart: 1,
      widthEnd: 1,
      curveBias: rng.float(-0.3, 0.3),
      obstacles: [
        {
          kind: 'movingGate',
          x: 0,
          t: 0.5,
          amplitude: 0.35 + difficulty * 0.3,
          speed: 1 + difficulty * 1.5,
        },
      ],
    }),
  },
  {
    kind: 'boost',
    difficulty: 0.2,
    weight: 1.5,
    build: (rng): SegmentGeometry => ({
      kind: 'boost',
      length: rng.float(100, 140),
      widthStart: 1,
      widthEnd: 1,
      curveBias: 0,
      obstacles: [{ kind: 'gem', x: 0, t: 0.5 }],
    }),
  },
];

/** Picks and builds the next segment given distance-based difficulty targeting */
export function pickNextSegment(
  rng: RNG,
  targetDifficulty: number,
  history: string[] // last N segment kinds, to discourage immediate repeats
): SegmentGeometry {
  const band = 0.28;
  let candidates = SEGMENT_LIBRARY.filter(
    (s) => Math.abs(s.difficulty - targetDifficulty) < band
  );
  if (candidates.length === 0) candidates = SEGMENT_LIBRARY;

  // down-weight the most recently used kind to avoid back-to-back repeats
  const lastKind = history[history.length - 1];
  const weighted = candidates.map((c) => ({
    ...c,
    weight: c.kind === lastKind ? c.weight * 0.35 : c.weight,
  }));

  const chosen = rng.weightedPick(weighted);
  return chosen.build(rng, targetDifficulty);
}
