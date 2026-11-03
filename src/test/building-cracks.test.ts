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
  it("reveals all 7 cracks sequentially by 24 seconds, leaving them visible until the 30-second loop restarts", () => {
    expect(CRACK_SEQUENCE_SECONDS).toBe(30);
    for (const { index } of BUILDING_CRACKS) {
      const start = crackStartSeconds(index);
      expect(start).toBeCloseTo(index * 24 / 7);
      expect(crackProgress(index, start)).toBeCloseTo(0);
      expect(crackProgress(index, start + CRACK_DURATION_SECONDS / 2)).toBeCloseTo(0.5);
      expect(crackProgress(index, start + CRACK_DURATION_SECONDS)).toBeCloseTo(1);
      expect(crackProgress(index, 30)).toBeCloseTo(1);
    }
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
  it("keeps floors 1 and 2 stationary at all times", () => {
    for (const time of [0, 5, 12, 24, 29.9]) {
      expect(floorOffsetY(1, time)).toBe(0);
      expect(floorOffsetY(2, time)).toBe(0);
      expect(floorGapWidth(1, time)).toBe(0);
      expect(floorGapWidth(2, time)).toBe(0);
    }
  });
  it("shifts floor 3 and every floor above it upward by the crack width", () => {
    expect(UPPER_FLOORS[0]?.floor).toBe(3);
    // Before any crack appears nothing moves.
    for (const { floor } of UPPER_FLOORS) expect(floorOffsetY(floor, 0)).toBe(0);
    // Once the sequence finished, every upper floor has moved up...
    for (const { floor } of UPPER_FLOORS) expect(floorOffsetY(floor, 24)).toBeLessThan(0);
    // ...and each higher floor has moved at least as far as the one below it.
    for (let i = 1; i < UPPER_FLOORS.length; i++) {
      const lower = UPPER_FLOORS[i - 1];
      const upper = UPPER_FLOORS[i];
      if (!lower || !upper) throw new Error("Missing floor");
      expect(floorOffsetY(upper.floor, 24)).toBeLessThanOrEqual(floorOffsetY(lower.floor, 24));
    }
    // The shift equals the accumulated crack width at each slab.
    const slabStep = 0; // floor 3 slab is the crack base
    const expectedGap = Math.max(...BUILDING_CRACKS.map(({ index }) => 2.5 + (Math.sin(slabStep * 1.6 + index) + 1) * 1.8));
    expect(floorGapWidth(3, 24)).toBeCloseTo(expectedGap, 8);
    expect(floorOffsetY(3, 24)).toBeCloseTo(-expectedGap, 8);
    // Offsets reset with the 30-second cycle.
    for (const { floor } of UPPER_FLOORS) expect(floorOffsetY(floor, crackCycleSeconds(30))).toBe(0);
  });
});
