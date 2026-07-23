import { RNG, dailySeed } from '../utils/rng';
import { pickNextSegment } from './segments/library';
import { SegmentGeometry, difficultyCurve } from './segments/types';

export interface GeneratedTrack {
  segments: SegmentGeometry[];
  /** cumulative distance at the start of each segment, same length as segments */
  segmentStartDistance: number[];
  totalLength: number;
}

const LOOKAHEAD_SEGMENTS = 6;

export class TrackGenerator {
  private rng: RNG;
  private segments: SegmentGeometry[] = [];
  private segmentStartDistance: number[] = [];
  private totalLength = 0;
  private history: string[] = [];

  constructor(seed: number) {
    this.rng = new RNG(seed);
    this.fillAhead();
  }

  /** Create a generator for today's fixed Challenge Track (same for every player) */
  static daily(): TrackGenerator {
    return new TrackGenerator(dailySeed());
  }

  /** Create a generator for a fresh endless run */
  static endless(): TrackGenerator {
    return new TrackGenerator(Date.now() ^ Math.floor(Math.random() * 1e9));
  }

  private fillAhead() {
    while (this.segments.length < LOOKAHEAD_SEGMENTS) {
      const difficulty = difficultyCurve(this.totalLength);
      const segment = pickNextSegment(this.rng, difficulty, this.history);
      this.segmentStartDistance.push(this.totalLength);
      this.segments.push(segment);
      this.history.push(segment.kind);
      if (this.history.length > 4) this.history.shift();
      this.totalLength += segment.length;
    }
  }

  /** Call each frame/tick with the ball's current traveled distance to keep the window filled */
  update(distanceTraveled: number) {
    // regenerate ahead once the ball is within 2 segments of the end of the buffer
    const bufferEnd = this.totalLength;
    if (bufferEnd - distanceTraveled < 400) {
      this.fillAhead();
    }
    // drop segments fully behind the ball to bound memory on long endless runs
    while (
      this.segments.length > 2 &&
      this.segmentStartDistance[1] + this.segments[0].length < distanceTraveled - 50
    ) {
      this.segments.shift();
      this.segmentStartDistance.shift();
    }
  }

  getVisibleSegments(): GeneratedTrack {
    return {
      segments: this.segments,
      segmentStartDistance: this.segmentStartDistance,
      totalLength: this.totalLength,
    };
  }
}
