export const CRACK_COUNT = 7;
export const CRACK_SEQUENCE_SECONDS = 30;
export const TOTAL_CRACK_COUNT = CRACK_COUNT;
// All cracks finish by this point, then the fully cracked house holds until the 30s loop restarts.
export const CRACK_REVEAL_SECONDS = 24;
export const CRACK_INTERVAL_SECONDS = CRACK_REVEAL_SECONDS / TOTAL_CRACK_COUNT;
export const CRACK_START_Y = 434;
export const CRACK_TOP_Y = 12;
export const CRACK_FLOOR_HEIGHT = 54;
export const CRACK_DURATION_SECONDS = CRACK_INTERVAL_SECONDS;

export function crackCycleSeconds(elapsedSeconds: number) {
  return Math.max(0, elapsedSeconds) % CRACK_SEQUENCE_SECONDS;
}

// Alternating order: the rightmost crack (index 6) starts first, then every other
// crack moving left (4, 2, 0), and finally the remaining ones from left to right (1, 3, 5).
export const CRACK_START_ORDER = [6, 4, 2, 0, 1, 3, 5];

export function crackStartSeconds(index: number) {
  const order = CRACK_START_ORDER.indexOf(index);
  return order * CRACK_INTERVAL_SECONDS;
}

export function crackTipY(index: number, elapsedSeconds: number) {
  return CRACK_START_Y - (CRACK_START_Y - CRACK_TOP_Y) * crackProgress(index, elapsedSeconds);
}

export function crackProgress(index: number, elapsedSeconds: number) {
  return Math.min(1, Math.max(0, (elapsedSeconds - crackStartSeconds(index)) / CRACK_DURATION_SECONDS));
}

// Deterministic, irregular fissures in the same component coordinates as the facade.
// Centers sit on the white facade piers, never on the balconies.
export const CRACK_BASE_X = [32, 160, 245, 381, 517, 600, 731];
export const BUILDING_CRACKS = Array.from({ length: CRACK_COUNT }, (_, index) => {
  const baseX = CRACK_BASE_X[index] ?? 32;
  const points: { x: number; y: number; width: number }[] = [];
  for (let step = 0; step <= 32; step++) {
    const y = CRACK_START_Y - (CRACK_START_Y - CRACK_TOP_Y) * step / 32;
    const x = baseX + Math.sin(step * 2.7 + index * 1.9) * 9 + Math.sin(step * 0.8 + index) * 6;
    points.push({ x, y, width: (2.5 + (Math.sin(step * 1.6 + index) + 1) * 1.8) * 0.5 });
  }
  const left = points.map(({ x, y, width }) => `${x - width},${y}`);
  const right = [...points].reverse().map(({ x, y, width }) => `${x + width},${y}`);
  return { index, path: `M ${left.join(" L ")} L ${right.join(" L ")} Z` };
});
