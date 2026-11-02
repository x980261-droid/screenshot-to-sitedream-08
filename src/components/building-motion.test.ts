import { describe, expect, it } from "vitest";
import {
  CRACK_LOWER,
  CRACK_UPPER,
  FALL_DURATION_MS,
  FIXED_FLOORS_FROM,
  SEAMS,
  SPARK_CROSSINGS,
  SPARK_INTERSECTIONS,
  SPARK_BURST_DURATION_MS,
  sparkActiveAt,
  crackClipPath,
  crackYAt,
  facadeDeformation,
  landingDistance,
} from "./building-motion";

describe("building collapse", () => {
  it("takes three seconds to fall", () => {
    expect(FALL_DURATION_MS).toBe(3000);
  });
  it("keeps the shop and second floor at the original facade position", () => {
    expect(FIXED_FLOORS_FROM).toBe(410);
  });
  it("lands the bottom of a falling fragment on the lawn", () => {
    expect(100 + 60 + landingDistance(100, 60)).toBe(593);
  });
  it("keeps upper floors visible and only partially deformed at full intensity", () => {
    const result = facadeDeformation(1, 593, 95);
    expect(result.opacity).toBe(1);
    expect(result.drop).toBe(12);
    expect(result.rotation).toBe(2);
  });
});

describe("jagged fracture lines", () => {
  it("breaks along an uneven crack, not a straight line", () => {
    const ys = CRACK_LOWER.map((p) => p.y);
    expect(new Set(ys).size).toBeGreaterThan(3);
    expect(Math.min(...ys)).toBeLessThan(FIXED_FLOORS_FROM);
    expect(Math.max(...ys)).toBeGreaterThan(FIXED_FLOORS_FROM);
  });
  it("makes every internal floor seam jagged, never a straight line", () => {
    expect(SEAMS.length).toBe(5);
    for (const seam of SEAMS) {
      const ys = seam.map((p) => p.y);
      expect(new Set(ys).size).toBeGreaterThan(3);
      expect(Math.max(...ys)).toBeGreaterThan(Math.min(...ys));
    }
  });
  it("keeps the crack flush with the building edges", () => {
    expect(CRACK_LOWER.at(0)?.y).toBe(FIXED_FLOORS_FROM);
    expect(CRACK_LOWER.at(-1)?.y).toBe(FIXED_FLOORS_FROM);
    expect(CRACK_UPPER.at(0)?.y).toBe(353);
    expect(CRACK_UPPER.at(-1)?.y).toBe(353);
  });
  it("spans the crack across the full facade width", () => {
    expect(CRACK_LOWER.at(0)?.x).toBe(0);
    expect(CRACK_LOWER.at(-1)?.x).toBe(760);
    for (let i = 1; i < CRACK_LOWER.length; i++) {
      expect(CRACK_LOWER.at(i)?.x).toBeGreaterThan(CRACK_LOWER.at(i - 1)?.x ?? -Infinity);
    }
  });
  it("clips fragments with a jagged polygon along the crack", () => {
    const low = Math.min(...CRACK_LOWER.map((p) => p.y));
    const high = Math.max(...CRACK_LOWER.map((p) => p.y));
    const clip = crackClipPath({ x: 190, y: 353, w: 190, h: high - 353 }, CRACK_UPPER, CRACK_LOWER);
    expect(clip.startsWith("polygon(")).toBe(true);
    expect(clip).toContain("%");
    // sampled crack height between nodes stays inside the torn band
    const mid = crackYAt(CRACK_LOWER, 380);
    expect(mid).toBeGreaterThan(low);
    expect(mid).toBeLessThan(high);
  });
});

describe("electrical spark crossings", () => {
  it("never repeats a spent spark burst at the same crossing", () => {
    expect(sparkActiveAt(0)).toBe(true);
    expect(sparkActiveAt(SPARK_BURST_DURATION_MS - 1)).toBe(true);
    for (let repeat = 1; repeat <= 100; repeat++) {
      expect(sparkActiveAt(SPARK_BURST_DURATION_MS * repeat)).toBe(false);
    }
  });
  it("sparks at 5% of the moving-part crossings", () => {
    expect(SPARK_INTERSECTIONS.length).toBe(Math.max(1, Math.round(SPARK_CROSSINGS.length * 0.05)));
  });
  it("places sparks only on real crossings of seams and vertical breaks", () => {
    const key = (p: { x: number; y: number }) => `${p.x}:${p.y}`;
    const all = new Set(SPARK_CROSSINGS.map(key));
    for (const p of SPARK_INTERSECTIONS) expect(all.has(key(p))).toBe(true);
  });
  it("keeps spark columns at the vertical breaks, not the facade edges", () => {
    for (const p of SPARK_CROSSINGS) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(760);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(420);
    }
  });
});
