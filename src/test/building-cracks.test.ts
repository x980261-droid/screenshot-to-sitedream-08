import { describe, expect, it } from "vitest";
import {
  BUILDING_CRACKS,
  CRACK_START_Y,
  CRACK_SEQUENCE_SECONDS,
  CRACK_DURATION_SECONDS,
  crackProgress,
  crackCycleSeconds,
  crackStartSeconds,
  crackTipY,
} from "@/lib/building-cracks";

describe("Building crack rules", () => {
  it("halves the width of every crack without moving its centerline", () => {
    for (const crack of BUILDING_CRACKS) {
      const coordinates = [...crack.path.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(match => Number(match[1]));
      for (let step = 0; step <= 32; step++) {
        const left = coordinates[step];
        const right = coordinates[65 - step];
        if (left === undefined || right === undefined) throw new Error("Missing crack edge");
        const originalFullWidth = 2 * (2.5 + (Math.sin(step * 1.6 + crack.index) + 1) * 1.8);
        expect(right - left).toBeCloseTo(originalFullWidth * 0.5, 8);
      }
    }
  });
  it("creates exactly seven cracks", () => {
    expect(BUILDING_CRACKS).toHaveLength(7);
  });
  it("keeps crack centers on the facade piers, not on the balconies", () => {
    for (const crack of BUILDING_CRACKS) {
      const xs = [...crack.path.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(match => Number(match[1]));
      expect(Math.min(...xs)).toBeGreaterThan(0);
      expect(Math.max(...xs)).toBeLessThan(760);
    }
  });
  it("reveals the center crack first, then all others outward from the center by 24 seconds, visible until the 30-second loop restarts", () => {
    expect(CRACK_SEQUENCE_SECONDS).toBe(30);
    const startOrder = [...BUILDING_CRACKS].sort((a, b) => crackStartSeconds(a.index) - crackStartSeconds(b.index)).map(c => c.index);
    expect(startOrder).toEqual([3, 2, 4, 1, 5, 0, 6]);
    for (const { index } of BUILDING_CRACKS) {
      const start = crackStartSeconds(index);
      expect(start).toBeCloseTo(startOrder.indexOf(index) * 24 / 7);
      expect(crackProgress(index, start)).toBeCloseTo(0);
      expect(crackProgress(index, start + CRACK_DURATION_SECONDS / 2)).toBeCloseTo(0.5);
      expect(crackProgress(index, start + CRACK_DURATION_SECONDS)).toBeCloseTo(1);
      expect(crackProgress(index, 30)).toBeCloseTo(1);
    }
    // The center crack (index 3) starts first, the leftmost crack (index 6) finishes last.
    expect(crackStartSeconds(3)).toBe(0);
    expect(crackStartSeconds(6) + CRACK_DURATION_SECONDS).toBeCloseTo(24);
  });
  it("starts at the third-floor slab without extending below it", () => {
    expect(CRACK_START_Y).toBe(434);
    expect(crackTipY(6, crackStartSeconds(6))).toBe(434);
  });
  it("stops at the roof and never resets", () => {
    expect(crackTipY(6, 200)).toBe(12);
    expect(crackTipY(6, 400)).toBe(12);
  });
  it("restarts the whole sequence every 30 seconds", () => {
    expect(crackCycleSeconds(29.9)).toBeCloseTo(29.9);
    for (const time of [30, 60, 90]) {
      expect(crackCycleSeconds(time)).toBe(0);
      expect(crackProgress(0, crackCycleSeconds(time))).toBe(0);
    }
    expect(crackCycleSeconds(31.2)).toBeCloseTo(1.2);
    expect(crackCycleSeconds(61.2)).toBeCloseTo(1.2);
  });
});
