export const FALL_DURATION_MS = 3000;
export const FIXED_FLOORS_FROM = 410;
export const SCENE_HEIGHT = 623;

export function landingDistance(top: number, height: number) {
  return Math.max(0, SCENE_HEIGHT - 30 - top - height);
}

export function facadeDeformation(intensity: number, drop: number, rotation: number) {
  const progress = Math.max(0, Math.min(1, intensity));
  return {
    drop: Math.min(12, Math.max(0, drop)) * progress,
    rotation: Math.max(-2, Math.min(2, rotation)) * progress,
    opacity: 1,
  };
}

export type CrackPoint = { x: number; y: number };

// Jagged "broken concrete" fracture lines across the facade, in facade pixels.
// The upper seam runs inside the collapsing mass; the lower seam is the tear
// against the stable floors 1-2 (centered on FIXED_FLOORS_FROM).
export const CRACK_UPPER = crackLine(353, 3.25, 760, 72, 3);
export const CRACK_LOWER = crackLine(FIXED_FLOORS_FROM, 5.5, 760, 72, 7);

// One jagged crack per floor boundary inside the collapsing mass (6 rows above y=353).
export const TOP_ROWS = 6;
export const SEAMS: CrackPoint[][] = [1, 2, 3, 4, 5].map((r) =>
  crackLine((r * 353) / TOP_ROWS, 4.5, 760, 72, r * 2 + 1),
);

// Jagged vertical cracks between facade sections (column boundaries of the grid).
export const VERTICAL_SEAMS: CrackPoint[][] = [190, 380, 570].map((x, i) =>
  crackLineV(x, 4, 440, 36, i + 5),
);

export function crackLine(centerY: number, amplitude: number, width: number, segments: number, seed: number): CrackPoint[] {
  const points: CrackPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const jitter = Math.sin(i * 12.9898 + seed * 78.233) * 0.5 + 0.5; // deterministic 0..1
    const edge = i === 0 || i === segments ? 0 : i % 2 === 1 ? 1 : -1;
    points.push({ x: (i / segments) * width, y: Math.round(centerY + edge * amplitude * (0.55 + 0.45 * jitter)) });
  }
  return points;
}

export function crackLineV(centerX: number, amplitude: number, height: number, segments: number, seed: number): CrackPoint[] {
  const points: CrackPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const jitter = Math.sin(i * 12.9898 + seed * 78.233) * 0.5 + 0.5; // deterministic 0..1
    const edge = i === 0 || i === segments ? 0 : i % 2 === 1 ? 1 : -1;
    points.push({ x: Math.round(centerX + edge * amplitude * (0.55 + 0.45 * jitter)), y: (i / segments) * height });
  }
  return points;
}

export function crackYAt(crack: CrackPoint[], x: number) {
  const first = crack.at(0);
  const last = crack.at(-1);
  if (!first || !last) return 0;
  if (x <= first.x) return first.y;
  if (x >= last.x) return last.y;
  for (let i = 1; i < crack.length; i++) {
    const a = crack.at(i - 1);
    const b = crack.at(i);
    if (a && b && x <= b.x) return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
  }
  return last.y;
}

// vertical crack (points sorted by y): x of the crack at a given y
export function crackXAt(crack: CrackPoint[], y: number) {
  const first = crack.at(0);
  const last = crack.at(-1);
  if (!first || !last) return 0;
  if (y <= first.y) return first.x;
  if (y >= last.y) return last.x;
  for (let i = 1; i < crack.length; i++) {
    const a = crack.at(i - 1);
    const b = crack.at(i);
    if (a && b && y <= b.y) return a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
  }
  return last.x;
}

// clip-path polygon for a fragment bounded by crack lines (horizontal top/bottom,
// vertical left); with no crack given that side stays a straight fragment edge
export function crackClipPath(
  frag: { x: number; y: number; w: number; h: number },
  top?: CrackPoint[],
  bottom?: CrackPoint[],
  left?: CrackPoint[],
): string | undefined {
  if (!top && !bottom && !left) return undefined;
  const x0 = frag.x;
  const x1 = frag.x + frag.w;
  const y0 = frag.y;
  const y1 = frag.y + frag.h;
  const pts: Array<[number, number]> = [];
  if (top) {
    pts.push([x0, crackYAt(top, x0)]);
    for (const p of top) if (p.x > x0 && p.x < x1) pts.push([p.x, p.y]);
    pts.push([x1, crackYAt(top, x1)]);
  } else {
    pts.push([x0, y0], [x1, y0]);
  }
  // right edge, straight (the fragment to the right clips its own left edge)
  pts.push([x1, y1]);
  if (bottom) {
    pts.push([x1, crackYAt(bottom, x1)]);
    for (let i = bottom.length - 1; i >= 0; i--) {
      const p = bottom.at(i);
      if (p && p.x > x0 && p.x < x1) pts.push([p.x, p.y]);
    }
    pts.push([x0, crackYAt(bottom, x0)]);
  } else {
    pts.push([x0, y1]);
  }
  // left edge, bottom -> top along a vertical crack
  if (left) {
    pts.push([crackXAt(left, y1), y1]);
    for (let i = left.length - 1; i >= 0; i--) {
      const p = left.at(i);
      if (p && p.y > y0 && p.y < y1) pts.push([p.x, p.y]);
    }
    pts.push([crackXAt(left, y0), y0]);
  }
  return `polygon(${pts
    .map(([px, py]) => `${(((px - x0) / frag.w) * 100).toFixed(2)}% ${(((py - y0) / frag.h) * 100).toFixed(2)}%`)
    .join(", ")})`;
}
