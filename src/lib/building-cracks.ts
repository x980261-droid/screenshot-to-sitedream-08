export const CRACK_COUNT = 7;
export const CRACK_SEQUENCE_SECONDS = 30;
export const TOTAL_CRACK_COUNT = 25;
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

export function crackStartSeconds(index: number) {
  return index * CRACK_INTERVAL_SECONDS;
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

// Thin secondary cracks sit on every balcony of floors 3-5, each rising from its own slab
// through the full height of its floor band.
export const BALCONY_CRACK_FLOORS = [3, 4, 5];
export const BALCONY_CRACK_WIDTH_SCALE = 0.5;
export const BALCONY_CRACK_HEIGHT = CRACK_FLOOR_HEIGHT;
export const BALCONY_CRACK_BASE_X = [95, 200, 312, 450, 566, 672];

export const BALCONY_CRACKS = BALCONY_CRACK_FLOORS.flatMap((floor, floorIndex) => {
  const startY = CRACK_START_Y - floorIndex * CRACK_FLOOR_HEIGHT;
  const topY = startY - BALCONY_CRACK_HEIGHT;
  return BALCONY_CRACK_BASE_X.map((baseX, columnIndex) => {
    const index = CRACK_COUNT + floorIndex * BALCONY_CRACK_BASE_X.length + columnIndex;
    const points: { x: number; y: number; width: number }[] = [];
    for (let step = 0; step <= 32; step++) {
      const y = startY - (startY - topY) * step / 32;
      const x = baseX + Math.sin(step * 2.1 + index * 1.3) * 3;
      points.push({ x, y, width: (2.5 + (Math.sin(step * 1.6 + index) + 1) * 1.8) * 0.5 * BALCONY_CRACK_WIDTH_SCALE });
    }
    const left = points.map(({ x, y, width }) => `${x - width},${y}`);
    const right = [...points].reverse().map(({ x, y, width }) => `${x + width},${y}`);
    return { index, floor, startY, topY, path: `M ${left.join(" L ")} L ${right.join(" L ")} Z` };
  });
});

export function balconyCrackTipY(crack: { index: number; startY: number; topY: number }, elapsedSeconds: number) {
  const progress = crackProgress(crack.index, elapsedSeconds);
  return crack.startY - (crack.startY - crack.topY) * progress;
}

export const UPPER_FLOORS = Array.from({ length: Math.ceil(CRACK_START_Y / CRACK_FLOOR_HEIGHT) }, (_, index) => ({
  floor: index + 3,
  bottomY: CRACK_START_Y - index * CRACK_FLOOR_HEIGHT,
  topY: Math.max(0, CRACK_START_Y - (index + 1) * CRACK_FLOOR_HEIGHT),
}));

export function floorGapWidth(floor: number, elapsedSeconds: number) {
  if (floor <= 2) return 0;
  const bottomY = CRACK_START_Y - (floor - 3) * CRACK_FLOOR_HEIGHT;
  const step = (CRACK_START_Y - bottomY) / (CRACK_START_Y - CRACK_TOP_Y) * 32;
  return Math.max(0, ...BUILDING_CRACKS.map(({ index }) => {
    if (crackTipY(index, elapsedSeconds) >= bottomY) return 0;
    const width = 2.5 + (Math.sin(step * 1.6 + index) + 1) * 1.8;
    return width * crackProgress(index, elapsedSeconds);
  }));
}

export function floorOffsetY(floor: number, elapsedSeconds: number) {
  let offset = 0;
  for (let current = 3; current <= floor; current++) offset -= floorGapWidth(current, elapsedSeconds);
  return offset;
}
