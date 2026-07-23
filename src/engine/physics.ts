import { GeneratedTrack } from './trackGenerator';

export interface BallState {
  /** lateral position across track width, -1 (left edge) .. 1 (right edge) */
  lateralPos: number;
  lateralVelocity: number;
  /** distance traveled along the track centerline */
  distance: number;
  /** forward speed, increases slowly over the run */
  forwardSpeed: number;
  chargeStartMs: number | null;
  chargeAmount: number; // 0..1
  alive: boolean;
}

export const PHYSICS_CONSTANTS = {
  MAX_CHARGE_MS: 650,
  BASE_FORWARD_SPEED: 90, // world units / second
  MAX_FORWARD_SPEED: 260,
  FORWARD_ACCEL: 2.2, // units/sec^2, ramps difficulty via speed over a run
  LATERAL_FRICTION: 3.5, // per-second decay of lateral velocity
  DRIFT_STRENGTH: 0.35, // how strongly curveBias pulls the ball sideways
  RELEASE_FORCE_MAX: 2.6,
  TRACK_HALF_WIDTH: 1, // matches lateralPos -1..1 range
};

export function createInitialBallState(): BallState {
  return {
    lateralPos: 0,
    lateralVelocity: 0,
    distance: 0,
    forwardSpeed: PHYSICS_CONSTANTS.BASE_FORWARD_SPEED,
    chargeStartMs: null,
    chargeAmount: 0,
    alive: true,
  };
}

/** Non-linear release curve: rewards releasing at the right instant over just holding longest */
function releaseForceCurve(chargeAmount: number): number {
  return Math.pow(chargeAmount, 1.6) * PHYSICS_CONSTANTS.RELEASE_FORCE_MAX;
}

export function onPressIn(ball: BallState, nowMs: number) {
  if (!ball.alive) return;
  ball.chargeStartMs = nowMs;
}

export function onPressOut(ball: BallState, nowMs: number) {
  if (!ball.alive || ball.chargeStartMs == null) return;
  const held = Math.min(nowMs - ball.chargeStartMs, PHYSICS_CONSTANTS.MAX_CHARGE_MS);
  ball.chargeAmount = held / PHYSICS_CONSTANTS.MAX_CHARGE_MS;

  // direction alternates: nudging always pushes back toward center from wherever
  // drift has carried the ball, giving the player agency without a directional button
  const direction = ball.lateralPos >= 0 ? -1 : 1;
  const force = releaseForceCurve(ball.chargeAmount) * direction;
  ball.lateralVelocity += force;

  ball.chargeStartMs = null;
  ball.chargeAmount = 0;
}

/**
 * Advances the simulation by dt seconds. Call from a Reanimated/Skia frame
 * callback running on the UI thread for jank-free 60fps updates.
 */
export function stepPhysics(
  ball: BallState,
  track: GeneratedTrack,
  dt: number,
  nowMs: number
) {
  if (!ball.alive) return;

  // live charge feedback (used to drive the charge-tone pitch + visual squash)
  if (ball.chargeStartMs != null) {
    const held = Math.min(nowMs - ball.chargeStartMs, PHYSICS_CONSTANTS.MAX_CHARGE_MS);
    ball.chargeAmount = held / PHYSICS_CONSTANTS.MAX_CHARGE_MS;
  }

  // forward speed ramps up over the run — this is the primary long-run difficulty driver
  ball.forwardSpeed = Math.min(
    PHYSICS_CONSTANTS.MAX_FORWARD_SPEED,
    ball.forwardSpeed + PHYSICS_CONSTANTS.FORWARD_ACCEL * dt
  );
  ball.distance += ball.forwardSpeed * dt;

  // find current segment to read its curveBias/width for drift + collision
  const segment = getSegmentAtDistance(track, ball.distance);
  if (segment) {
    ball.lateralVelocity += segment.curveBias * PHYSICS_CONSTANTS.DRIFT_STRENGTH * dt;
  }

  // friction decay
  const frictionFactor = Math.max(0, 1 - PHYSICS_CONSTANTS.LATERAL_FRICTION * dt);
  ball.lateralVelocity *= frictionFactor;

  ball.lateralPos += ball.lateralVelocity * dt;

  // collision vs track edges (width narrows in 'narrow' segments)
  const halfWidth = segment
    ? PHYSICS_CONSTANTS.TRACK_HALF_WIDTH * segmentWidthAt(segment, track, ball.distance)
    : PHYSICS_CONSTANTS.TRACK_HALF_WIDTH;

  if (Math.abs(ball.lateralPos) > halfWidth) {
    ball.alive = false; // run ends — caller triggers death screen / restart flow
  }
}

function getSegmentAtDistance(track: GeneratedTrack, distance: number) {
  for (let i = 0; i < track.segments.length; i++) {
    const start = track.segmentStartDistance[i];
    const end = start + track.segments[i].length;
    if (distance >= start && distance < end) return track.segments[i];
  }
  return null;
}

function segmentWidthAt(
  segment: GeneratedTrack['segments'][number],
  track: GeneratedTrack,
  distance: number
): number {
  const idx = track.segments.indexOf(segment);
  const start = track.segmentStartDistance[idx];
  const progress = Math.min(1, Math.max(0, (distance - start) / segment.length));
  return segment.widthStart + (segment.widthEnd - segment.widthStart) * progress;
}
