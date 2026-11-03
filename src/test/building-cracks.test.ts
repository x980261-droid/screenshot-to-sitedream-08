import { describe, expect, it } from "vitest";
import {
  BALCONY_CRACKS,
  BALCONY_CRACK_FLOORS,
  BALCONY_CRACK_WIDTH_SCALE,
  BUILDING_CRACKS,
  CRACK_FLOOR_HEIGHT,
  CRACK_START_Y,
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
  it("starts a new crack every five seconds", () => {
    expect(BUILDING_CRACKS.map(({ index }) => crackStartSeconds(index))).toEqual([0, 5, 10, 15, 20, 25, 30]);
  });
  it("advances upward by one 54-pixel storey in fifteen seconds", () => {
    expect(crackTipY(0, 15)).toBe(CRACK_START_Y - 54);
    expect(crackTipY(1, 20)).toBe(CRACK_START_Y - 54);
  });
  it("starts at the third-floor slab without extending below it", () => {
    expect(CRACK_START_Y).toBe(434);
    expect(crackTipY(6, 29)).toBe(434);
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
  it("reveals every balcony crack fully within the first five seconds", () => {
    for (const crack of BALCONY_CRACKS) {
      expect(balconyCrackTipY(crack, 0)).toBe(crack.startY);
      expect(balconyCrackTipY(crack, 2.5)).toBe((crack.startY + crack.topY) / 2);
      expect(balconyCrackTipY(crack, 5)).toBe(crack.topY);
      expect(balconyCrackTipY(crack, 1000)).toBe(crack.topY);
    }
  });
});
