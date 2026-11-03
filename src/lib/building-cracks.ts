export const CRACK_COUNT = 8;
export const CRACK_INTERVAL_SECONDS = 5;
export const CRACK_SECONDS_PER_FLOOR = 15;
export const CRACK_START_Y = 434;
export const CRACK_TOP_Y = 12;
export const CRACK_FLOOR_HEIGHT = 54;
export const CRACK_DURATION_SECONDS =
  ((CRACK_START_Y - CRACK_TOP_Y) / CRACK_FLOOR_HEIGHT) * CRACK_SECONDS_PER_FLOOR;

export function crackStartSeconds(index: number) {
  return index * CRACK_INTERVAL_SECONDS;
}

export function crackTipY(index: number, elapsedSeconds: number) {
  const activeSeconds = Math.max(0, elapsedSeconds - crackStartSeconds(index));
  return Math.max(CRACK_TOP_Y, CRACK_START_Y - activeSeconds * CRACK_FLOOR_HEIGHT / CRACK_SECONDS_PER_FLOOR);
}

// Hovering the building widens every crack by 50% over 3 seconds (around its own centerline);
// when the cursor leaves, the width returns to normal over 1 second.
export const CRACK_HOVER_WIDEN = 1.5;
export const CRACK_HOVER_WIDEN_SECONDS = 3;
export const CRACK_HOVER_SHRINK_SECONDS = 1;
export const CRACK_CENTER_X = [61, 146, 224, 310, 410, 495, 577, 671];

export function crackWidthScale(from: number, hovering: boolean, elapsedSeconds: number) {
  const target = hovering ? CRACK_HOVER_WIDEN : 1;
  const duration = hovering ? CRACK_HOVER_WIDEN_SECONDS : CRACK_HOVER_SHRINK_SECONDS;
  const progress = Math.min(1, Math.max(0, elapsedSeconds / duration));
  return from + (target - from) * progress;
}

// Deterministic, irregular fissures in the same component coordinates as the facade.
export const BUILDING_CRACKS = Array.from({ length: CRACK_COUNT }, (_, index) => {
  const baseX = [61, 146, 224, 310, 410, 495, 577, 671][index] ?? 61;
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