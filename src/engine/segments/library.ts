import { RNG } from '../../utils/rng';
import { SegmentDefinition, SegmentGeometry, SegmentObstacle } from './types';

function powerupOrCoinRow(rng: RNG, count: number): SegmentObstacle[] {
  const out: SegmentObstacle[] = [];
  const roll = rng.next();
  if (roll > 0.85) {
    out.push({ kind: 'shield', x: rng.float(-0.3, 0.3), t: 0.5 });
  } else if (roll > 0.72) {
    out.push({ kind: 'magnet', x: rng.float(-0.3, 0.3), t: 0.5 });
  } else if (roll > 0.35) { // Spawn fuel more frequently (37% chance up from 23%)
    out.push({ kind: 'fuel', x: rng.float(-0.4, 0.4), t: 0.4 });
  } else if (roll > 0.15) {
    out.push({ kind: 'car', x: rng.float(-0.5, 0.5), t: 0.3, carVariant: rng.int(1, 9) });
  }

  for (let i = 0; i < count; i++) {
    out.push({ kind: 'coin', x: rng.float(-0.4, 0.4), t: (i + 1) / (count + 1) });
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
      obstacles: powerupOrCoinRow(rng, rng.int(2, 4)),
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
          { kind: 'car', x: rng.float(-0.5, -0.2), t: 0.3, carVariant: rng.int(1, 9) },
          { kind: 'car', x: rng.float(0.2, 0.5), t: 0.7, carVariant: rng.int(1, 9) },
          ...powerupOrCoinRow(rng, 2),
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
        obstacles: powerupOrCoinRow(rng, 3),
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
          kind: 'police',
          x: 0,
          t: 0.5,
          amplitude: 0.38 + difficulty * 0.15,
          speed: 0.5 + difficulty * 0.4,
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
      obstacles: [
        { kind: 'gem', x: rng.float(-0.2, 0.2), t: 0.5 },
        { kind: 'shield', x: -0.3, t: 0.8 },
        { kind: 'fuel', x: 0.3, t: 0.8 } // Guaranteed fuel canister in boost segments
      ],
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
