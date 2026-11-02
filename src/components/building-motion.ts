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

export function crackLine(centerY: number, amplitude: number, width: number, segments: number, seed: number): CrackPoint[] {
  const points: CrackPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const jitter = Math.sin(i * 12.9898 + seed * 78.233) * 0.5 + 0.5; // deterministic 0..1
    const edge = i === 0 || i === segments ? 0 : i % 2 === 1 ? 1 : -1;
    points.push({ x: (i / segments) * width, y: Math.round(centerY + edge * amplitude * (0.55 + 0.45 * jitter)) });
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

// clip-path polygon for a fragment bounded above and/or below by a crack line;
// with no crack given that side stays a straight fragment edge
export function crackClipPath(
  frag: { x: number; y: number; w: number; h: number },
  top?: CrackPoint[],
  bottom?: CrackPoint[],
) {
  const x0 = frag.x;
  const x1 = frag.x + frag.w;
  const pts: Array<[number, number]> = [];
  if (top) {
    pts.push([x0, crackYAt(top, x0)]);
    for (const p of top) if (p.x > x0 && p.x < x1) pts.push([p.x, p.y]);
    pts.push([x1, crackYAt(top, x1)]);
  } else {
    pts.push([x0, frag.y], [x1, frag.y]);
  }
  if (bottom) {
    pts.push([x1, crackYAt(bottom, x1)]);
    for (let i = bottom.length - 1; i >= 0; i--) {
      const p = bottom.at(i);
      if (p && p.x > x0 && p.x < x1) pts.push([p.x, p.y]);
    }
    pts.push([x0, crackYAt(bottom, x0)]);
  } else {
    pts.push([x1, frag.y + frag.h], [x0, frag.y + frag.h]);
  }
  return `polygon(${pts
    .map(([px, py]) => `${(((px - x0) / frag.w) * 100).toFixed(2)}% ${(((py - frag.y) / frag.h) * 100).toFixed(2)}%`)
    .join(", ")})`;
}

// Jagged vertical fracture between facade columns, points ordered top → bottom.
export const VERTICAL_AMP = 4;
export function verticalCrack(centerX: number, fromY: number, toY: number, seed: number): CrackPoint[] {
  const segments = Math.max(2, Math.round((toY - fromY) / 5));
  const points: CrackPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const jitter = Math.sin(i * 12.9898 + seed * 78.233) * 0.5 + 0.5;
    const edge = i % 2 === 1 ? 1 : -1;
    points.push({ x: Math.round(centerX + edge * VERTICAL_AMP * (0.55 + 0.45 * jitter)), y: fromY + ((toY - fromY) * i) / segments });
  }
  return points;
}

// Adds a jagged left edge to a polygon clip (or to the full box when clip is undefined).
export function withJaggedLeft(frag: { x: number; y: number; w: number; h: number }, clip: string | undefined, left: CrackPoint[]) {
  const pct = (p: CrackPoint) => `${(((p.x - frag.x) / frag.w) * 100).toFixed(2)}% ${(((p.y - frag.y) / frag.h) * 100).toFixed(2)}%`;
  const body = clip ? clip.slice("polygon(".length, -1).split(", ") : ["0.00% 0.00%", "100.00% 0.00%", "100.00% 100.00%", "0.00% 100.00%"];
  const jag = [...left].reverse().map(pct);
  return `polygon(${[...body, ...jag].join(", ")})`;
}

// Electrical sparks at the crossings of moving facade parts: horizontal fracture
// seams × vertical breaks between columns. Only 25% of the crossings spark.
export type SparkPoint = { x: number; y: number };

const SPARK_WIDTH = 760;
const SPARK_COL_COUNT = 4;

function sparkRand(seed: number) {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export const SPARK_CROSSINGS: SparkPoint[] = [...SEAMS, CRACK_LOWER].flatMap((seam) =>
  Array.from({ length: SPARK_COL_COUNT - 1 }, (_, c) => {
    const x = ((c + 1) * SPARK_WIDTH) / SPARK_COL_COUNT;
    return { x, y: crackYAt(seam, x) };
  }),
);

export const SPARK_INTERSECTIONS = SPARK_CROSSINGS.filter((_, i) => sparkRand(i + 4) < 0.25).slice(0, Math.round(SPARK_CROSSINGS.length * 0.25));
