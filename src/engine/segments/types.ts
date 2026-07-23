import { RNG } from '../../utils/rng';

export type SegmentKind = 'straight' | 'chicane' | 'gate' | 'boost' | 'narrow';

/** A resolved obstacle/decoration placed within a segment, in local segment space */
export interface SegmentObstacle {
  kind: 'spike' | 'wall' | 'coin' | 'gem' | 'movingGate';
  /** lateral position, -1 (left edge) .. 1 (right edge) */
  x: number;
  /** distance along the segment, 0..1 */
  t: number;
  /** for movingGate: oscillation amplitude/speed */
  amplitude?: number;
  speed?: number;
}

/** Concrete geometry for one generated segment instance */
export interface SegmentGeometry {
  kind: SegmentKind;
  length: number; // world units
  /** track width multiplier at start/end, 1 = normal width, <1 = narrowed */
  widthStart: number;
  widthEnd: number;
  /** lateral curve of the track centerline, -1..1, applied over the segment length */
  curveBias: number;
  obstacles: SegmentObstacle[];
}

export interface SegmentDefinition {
  kind: SegmentKind;
  /** target difficulty this segment represents, 0 (trivial) .. 1 (extreme) */
  difficulty: number;
  /** relative selection weight before difficulty filtering */
  weight: number;
  build: (rng: RNG, difficulty: number) => SegmentGeometry;
}

/** Maps distance traveled (world units) -> target difficulty 0..1 */
export function difficultyCurve(distance: number): number {
  const RAMP_DISTANCE = 2000; // difficulty climbs steadily for the first ~2000 units
  const base = Math.min(distance / RAMP_DISTANCE, 1);
  // after the initial ramp, oscillate gently so runs don't feel like a flat treadmill
  const oscillation = distance > RAMP_DISTANCE
    ? 0.08 * Math.sin(distance / 400)
    : 0;
  return Math.max(0, Math.min(1, base * 0.85 + oscillation));
}
