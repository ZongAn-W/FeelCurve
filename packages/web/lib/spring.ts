export type SpringResponse = {
  /** SVG path for a 200 × 56 viewBox */
  path: string;
  /** overshoot as a percentage of the initial displacement */
  overshoot: number;
  /** time in seconds until the value stays inside a 2% band */
  settle: number;
};

const VIEW_W = 200;
const VIEW_H = 56;
const PAD = 6;
/** displacement domain shown in the mini chart: slight overshoot above, bounce below */
const MIN_X = -0.42;
const MAX_X = 1.12;

/**
 * Step response of a damped spring released from x = 1 to x = 0.
 * Integrated with semi-implicit Euler — deterministic, no dependency.
 */
export function springResponse(
  stiffness: number,
  damping: number,
  mass = 1,
  duration = 1.1,
): SpringResponse {
  const dt = 1 / 480;
  const stepCount = 96;
  const sampleEvery = duration / stepCount;

  let x = 1;
  let v = 0;
  let nextSample = 0;
  const points: { t: number; x: number }[] = [];

  for (let t = 0; t <= duration + dt * 0.5; t += dt) {
    while (nextSample <= stepCount && t >= nextSample * sampleEvery) {
      points.push({ t: nextSample * sampleEvery, x });
      nextSample += 1;
    }
    const a = (-stiffness * x - damping * v) / mass;
    v += a * dt;
    x += v * dt;
  }

  let overshoot = 0;
  let lastOutside = 0;
  for (const point of points) {
    overshoot = Math.max(overshoot, -point.x);
    if (Math.abs(point.x) >= 0.02) lastOutside = point.t;
  }

  const toY = (value: number) => {
    const clamped = Math.min(Math.max(value, MIN_X), MAX_X);
    const normalized = (MAX_X - clamped) / (MAX_X - MIN_X);
    return PAD + normalized * (VIEW_H - PAD * 2);
  };

  const path = points
    .map((point, index) => {
      const cx = (point.t / duration) * VIEW_W;
      const cy = toY(point.x);
      return `${index === 0 ? "M" : "L"}${cx.toFixed(2)} ${cy.toFixed(2)}`;
    })
    .join(" ");

  return {
    path,
    overshoot: Math.max(0, overshoot) * 100,
    settle: Math.min(lastOutside, duration),
  };
}

export const SPRING_VIEWBOX = `0 0 ${VIEW_W} ${VIEW_H}`;

export function zeroLineY(): number {
  const normalized = (MAX_X - 0) / (MAX_X - MIN_X);
  return PAD + normalized * (VIEW_H - PAD * 2);
}
