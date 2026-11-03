import { describe, expect, it } from "vitest";
import {
  BALCONY_CRACKS,
  BALCONY_CRACK_FLOORS,
  BALCONY_CRACK_WIDTH_SCALE,
  BUILDING_CRACKS,
  CRACK_FLOOR_HEIGHT,
  CRACK_START_Y,
  CRACK_SEQUENCE_SECONDS,
  CRACK_DURATION_SECONDS,
  UPPER_FLOORS,
  crackProgress,
  floorGapWidth,
  floorOffsetY,
  balconyCrackTipY,
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
  it("reveals all 25 cracks sequentially from first to last within 30 seconds", () => {
    const cracks = [...BUILDING_CRACKS, ...BALCONY_CRACKS];
    expect(cracks).toHaveLength(25);
    expect(CRACK_SEQUENCE_SECONDS).toBe(30);
    for (const { index } of cracks) {
      const start = crackStartSeconds(index);
      expect(start).toBeCloseTo(index * 1.2);
      expect(crackProgress(index, start)).toBeCloseTo(0);
      expect(crackProgress(index, start + 0.6)).toBeCloseTo(0.5);
      expect(crackProgress(index, start + CRACK_DURATION_SECONDS)).toBeCloseTo(1);
      if (index < 24) expect(crackProgress(index + 1, start + 0.6)).toBe(0);
      expect(crackProgress(index, 30)).toBeCloseTo(1);
    }
    expect(crackStartSeconds(24) + CRACK_DURATION_SECONDS).toBeCloseTo(30);
  });
  it("starts at the third-floor slab without extending below it", () => {
    expect(CRACK_START_Y).toBe(434);
    expect(crackTipY(6, 7)).toBe(434);
  });
  it("stops at the roof and never resets", () => {
    expect(crackTipY(6, 200)).toBe(12);
    expect(crackTipY(6, 400)).toBe(12);
  });
});

describe("Balcony crack rules", () => {
  it("places balcony cracks only on floors 3, 4 and 5", () => {
    expect(BALCONY_CRACK_FLOORS).toEqual([3, 4, 5]);
    expect(new Set(BALCONY_CRACKS.map(crack => crack.floor))).toEqual(new Set([3, 4, 5]));
  });
  it("makes every balcony crack half as wide as a main crack", () => {
    expect(BALCONY_CRACK_WIDTH_SCALE).toBe(0.5);
    for (const crack of BALCONY_CRACKS) {
      const coordinates = [...crack.path.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(match => Number(match[1]));
      for (let step = 0; step <= 8; step++) {
        const left = coordinates[step];
        const right = coordinates[17 - step];
        if (left === undefined || right === undefined) throw new Error("Missing balcony crack edge");
        const mainFullWidth = 2 * (2.5 + (Math.sin(step * 1.6 + crack.index) + 1) * 1.8) * 0.5;
        expect(right - left).toBeCloseTo(mainFullWidth * 0.5, 8);
      }
    }
  });
  it("keeps each balcony crack inside its own floor band", () => {
    for (const crack of BALCONY_CRACKS) {
      const floorIndex = crack.floor - 3;
      expect(crack.startY).toBe(CRACK_START_Y - floorIndex * CRACK_FLOOR_HEIGHT);
      expect(crack.topY).toBeGreaterThan(crack.startY - CRACK_FLOOR_HEIGHT);
    }
  });
  it("reveals balcony cracks in their shared sequence slot and never resets", () => {
    for (const crack of BALCONY_CRACKS) {
      const start = crackStartSeconds(crack.index);
      expect(balconyCrackTipY(crack, start)).toBe(crack.startY);
      expect(balconyCrackTipY(crack, start + 0.6)).toBeCloseTo((crack.startY + crack.topY) / 2);
      expect(balconyCrackTipY(crack, 30)).toBe(crack.topY);
      expect(balconyCrackTipY(crack, 1000)).toBe(crack.topY);
    }
  });
});

describe("Floor separation rules", () => {
  it("keeps the first and second floors stationary throughout the sequence", () => {
    expect(UPPER_FLOORS.map(({ floor }) => floor)).not.toContain(1);
    expect(UPPER_FLOORS.map(({ floor }) => floor)).not.toContain(2);
    for (const time of [0, 0.6, 5, 15, 30, 100]) {
      expect(floorOffsetY(1, time)).toBe(0);
      expect(floorOffsetY(2, time)).toBe(0);
    }
    expect(UPPER_FLOORS[0]?.bottomY).toBe(434);
  });
  it("separates adjacent upper floors by the visible main crack width", () => {
    expect(floorOffsetY(3, 0)).toBe(0);
    expect(floorGapWidth(3, 30)).toBeCloseTo(Math.max(...BUILDING_CRACKS.map(({ index }) => 2.5 + (Math.sin(index) + 1) * 1.8)));
    for (const { floor } of UPPER_FLOORS) {
      expect(floorOffsetY(floor - 1, 30) - floorOffsetY(floor, 30)).toBeCloseTo(floorGapWidth(floor, 30));
      expect(floorOffsetY(floor, 30)).toBeLessThan(0);
      expect(floorOffsetY(floor, 100)).toBe(floorOffsetY(floor, 30));
    }
  });
});
