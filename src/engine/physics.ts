import { GeneratedTrack } from './trackGenerator';

export interface BallState {
  /** lateral position across track width, -1 (left edge) .. 1 (right edge) */
  lateralPos: number;
  lateralVelocity: number;
  targetLateralPos: number | null;
  /** distance traveled along the track centerline */
  distance: number;
  /** forward speed, increases slowly over the run */
  forwardSpeed: number;
  chargeStartMs: number | null;
  chargeAmount: number; // 0..1
  alive: boolean;
  lives: number; // 1 life per run
  fuel: number; // 0..100 fuel meter
  hasShield: boolean;
  magnetTimer: number; // seconds remaining
  shieldTimer: number;
}

export const PHYSICS_CONSTANTS = {
  MAX_CHARGE_MS: 650,
  BASE_FORWARD_SPEED: 85, // smoother start speed
  MAX_FORWARD_SPEED: 320, // increased max speed for higher challenge
  FORWARD_ACCEL: 2.2, // increased forward acceleration (was 1.2) to scale up speed faster
  LATERAL_FRICTION: 3.5, // per-second decay of lateral velocity
  DRIFT_STRENGTH: 0.28, // gentle drift
  RELEASE_FORCE_MAX: 2.8,
  TRACK_HALF_WIDTH: 1, // matches lateralPos -1..1 range

  // Drag-tracking smoothing: how quickly lateralPos closes the gap toward
  // targetLateralPos each second. Higher = snappier/more responsive but more
  // twitchy; lower = smoother but more input lag. 12-16 feels tactile without
  // feeling robotic — the old value of 22 (applied as a hard velocity
  // overwrite, not a smoothed approach) is what made drag feel like an
  // instant snap rather than a "nudge."
  DRAG_TRACKING_RATE: 14,
};

export function createInitialBallState(): BallState {
  return {
    lateralPos: 0,
    lateralVelocity: 0,
    targetLateralPos: null,
    distance: 0,
    forwardSpeed: PHYSICS_CONSTANTS.BASE_FORWARD_SPEED,
    chargeStartMs: null,
    chargeAmount: 0,
    alive: true,
    lives: 1, // 1 life only!
    fuel: 100, // 100% Full Fuel Tank at start!
    hasShield: false, // No free shield — earn it!
    magnetTimer: 0,
    shieldTimer: 0,
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

export interface CollisionEvent {
  type:
    | 'coin'
    | 'gem'
    | 'shield'
    | 'magnet'
    | 'fuel'
    | 'car'
    | 'police'
    | 'car_crash'
    | 'busted'
    | 'shield_break'
    | 'death';
  x: number;
  y: number;
}

/**
 * Advances the simulation by dt seconds. Call from frame callback.
 */
export function stepPhysics(
  ball: BallState,
  track: GeneratedTrack,
  dt: number,
  nowMs: number,
  onEvent?: (event: CollisionEvent) => void
) {
  if (!ball.alive) return;

  // live charge feedback (used to drive the charge-tone pitch + visual squash)
  if (ball.chargeStartMs != null) {
    const held = Math.min(nowMs - ball.chargeStartMs, PHYSICS_CONSTANTS.MAX_CHARGE_MS);
    ball.chargeAmount = held / PHYSICS_CONSTANTS.MAX_CHARGE_MS;
  }

  // update timers
  if (ball.magnetTimer > 0) ball.magnetTimer = Math.max(0, ball.magnetTimer - dt);

  // Drain fuel gradually over time (balanced to 2.8 per second down from 3.8)
  ball.fuel = Math.max(0, ball.fuel - 2.8 * dt);
  if (ball.fuel <= 0) {
    ball.alive = false;
    onEvent?.({ type: 'death', x: ball.lateralPos, y: 0.6 });
    return;
  }

  // forward speed ramps up over the run
  ball.forwardSpeed = Math.min(
    PHYSICS_CONSTANTS.MAX_FORWARD_SPEED,
    ball.forwardSpeed + PHYSICS_CONSTANTS.FORWARD_ACCEL * dt
  );
  ball.distance += ball.forwardSpeed * dt;

  // find current segment to read its curveBias/width for drift + collision
  const segment = getSegmentAtDistance(track, ball.distance);

  if (ball.targetLateralPos !== null) {
    // Smoothed tactile tracking: exponential approach toward the finger's target position
    const diff = ball.targetLateralPos - ball.lateralPos;
    const smoothing = 1 - Math.exp(-PHYSICS_CONSTANTS.DRAG_TRACKING_RATE * dt);
    ball.lateralPos += diff * smoothing;
    ball.lateralVelocity = (diff * smoothing) / Math.max(dt, 0.0001);
  } else {
    if (segment) {
      ball.lateralVelocity += segment.curveBias * PHYSICS_CONSTANTS.DRIFT_STRENGTH * dt;
    }
    // friction decay
    const frictionFactor = Math.max(0, 1 - PHYSICS_CONSTANTS.LATERAL_FRICTION * dt);
    ball.lateralVelocity *= frictionFactor;
    ball.lateralPos += ball.lateralVelocity * dt;
  }

  // collision vs track edges
  const halfWidth = segment
    ? PHYSICS_CONSTANTS.TRACK_HALF_WIDTH * segmentWidthAt(segment, track, ball.distance)
    : PHYSICS_CONSTANTS.TRACK_HALF_WIDTH;

  if (Math.abs(ball.lateralPos) > halfWidth) {
    if (ball.hasShield) {
      ball.hasShield = false;
      ball.lateralPos = Math.sign(ball.lateralPos) * (halfWidth - 0.15);
      ball.lateralVelocity = -ball.lateralVelocity * 0.6;
      onEvent?.({ type: 'shield_break', x: ball.lateralPos, y: 0.6 });
    } else {
      ball.alive = false;
      onEvent?.({ type: 'car_crash', x: ball.lateralPos, y: 0.6 });
      return;
    }
  }

  // Check obstacle collisions and pickups in visible segments
  for (let i = 0; i < track.segments.length; i++) {
    const segStart = track.segmentStartDistance[i];
    const seg = track.segments[i];

    for (const obs of seg.obstacles) {
      if (obs.collected) continue;

      const obsDistance = segStart + obs.t * seg.length;
      const distDiff = Math.abs(ball.distance - obsDistance);

      // Check pickup proximity along longitudinal distance
      if (distDiff < 8) {
        let obsX = obs.x;
        if (obs.kind === 'police' && obs.amplitude && obs.speed) {
          obsX = obs.x + Math.sin(nowMs * 0.0008 * obs.speed) * obs.amplitude;
        }

        const dx = Math.abs(ball.lateralPos - obsX);

        if (
          obs.kind === 'coin' ||
          obs.kind === 'gem' ||
          obs.kind === 'shield' ||
          obs.kind === 'magnet'
        ) {
          const radius = ball.magnetTimer > 0 ? 0.6 : 0.28;
          if (dx < radius) {
            obs.collected = true;
            if (obs.kind === 'shield') ball.hasShield = true;
            if (obs.kind === 'magnet') ball.magnetTimer = 8;
            onEvent?.({ type: obs.kind, x: obsX, y: 0.6 });
          }
        } else if (obs.kind === 'fuel') {
          if (dx < 0.32) {
            obs.collected = true;
            ball.fuel = Math.min(100, ball.fuel + 45); // Refill +45 fuel (was +35)
            onEvent?.({ type: 'fuel', x: obsX, y: 0.6 });
          }
        } else if (obs.kind === 'car' || obs.kind === 'police' || obs.kind === 'wall' || obs.kind === 'spike') {
          if (dx < 0.22) {
            obs.collected = true;
            if (ball.hasShield) {
              ball.hasShield = false;
              onEvent?.({ type: 'shield_break', x: obsX, y: 0.6 });
            } else {
              ball.alive = false;
              // Specific event type for car crash vs police busted
              const deathType = obs.kind === 'police' ? 'busted' : 'car_crash';
              onEvent?.({ type: deathType, x: obsX, y: 0.6 });
              return;
            }
          }
        }
      }
    }
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