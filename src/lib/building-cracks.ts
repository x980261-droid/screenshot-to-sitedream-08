export const CRACK_COUNT = 7;
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

// Thin secondary cracks on the balcony fronts of floors 3, 4 and 5.
// They are half as wide as the main pier cracks and grow at the same speed,
// starting after the main cracks, one every CRACK_INTERVAL_SECONDS.
export const BALCONY_CRACK_FLOORS = [3, 4, 5];
export const BALCONY_CRACK_WIDTH_SCALE = 0.5;
export const BALCONY_CRACK_HEIGHT = 20;
export const BALCONY_CRACK_BASE_X = [95, 200, 312, 450, 566, 672];

export const BALCONY_CRACKS = BALCONY_CRACK_FLOORS.flatMap((floor, floorIndex) => {
  const startY = CRACK_START_Y - floorIndex * CRACK_FLOOR_HEIGHT;
  const topY = startY - BALCONY_CRACK_HEIGHT;
  return BALCONY_CRACK_BASE_X.map((baseX, columnIndex) => {
    const index = CRACK_COUNT + floorIndex * BALCONY_CRACK_BASE_X.length + columnIndex;
    const points: { x: number; y: number; width: number }[] = [];
    for (let step = 0; step <= 8; step++) {
      const y = startY - (startY - topY) * step / 8;
      const x = baseX + Math.sin(step * 2.1 + index * 1.3) * 3;
      points.push({ x, y, width: (2.5 + (Math.sin(step * 1.6 + index) + 1) * 1.8) * 0.5 * BALCONY_CRACK_WIDTH_SCALE });
    }
    const left = points.map(({ x, y, width }) => `${x - width},${y}`);
    const right = [...points].reverse().map(({ x, y, width }) => `${x + width},${y}`);
    return { index, floor, startY, topY, path: `M ${left.join(" L ")} L ${right.join(" L ")} Z` };
  });
});

export function balconyCrackTipY(crack: { index: number; startY: number; topY: number }, elapsedSeconds: number) {
  const activeSeconds = Math.max(0, elapsedSeconds - crackStartSeconds(crack.index));
  return Math.max(crack.topY, crack.startY - activeSeconds * CRACK_FLOOR_HEIGHT / CRACK_SECONDS_PER_FLOOR);
}
