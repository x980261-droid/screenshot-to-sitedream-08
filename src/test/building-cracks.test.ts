import { describe, expect, it } from "vitest";
import { BUILDING_CRACKS, CRACK_CENTER_X, CRACK_HOVER_SHRINK_SECONDS, CRACK_HOVER_WIDEN, CRACK_HOVER_WIDEN_SECONDS, CRACK_START_Y, crackStartSeconds, crackTipY } from "@/lib/building-cracks";

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
  it("creates exactly eight cracks", () => {
    expect(BUILDING_CRACKS).toHaveLength(8);
  });
  it("starts a new crack every five seconds", () => {
    expect(BUILDING_CRACKS.map(({ index }) => crackStartSeconds(index))).toEqual([0, 5, 10, 15, 20, 25, 30, 35]);
  });
  it("advances upward by one 54-pixel storey in fifteen seconds", () => {
    expect(crackTipY(0, 15)).toBe(CRACK_START_Y - 54);
    expect(crackTipY(1, 20)).toBe(CRACK_START_Y - 54);
  });
  it("starts at the third-floor slab without extending below it", () => {
    expect(CRACK_START_Y).toBe(434);
    expect(crackTipY(7, 34)).toBe(434);
  });
  it("stops at the roof and never resets", () => {
    expect(crackTipY(7, 200)).toBe(12);
    expect(crackTipY(7, 400)).toBe(12);
  });
  it("widens every crack by 50% over three seconds on hover, around its own centerline", () => {
    expect(CRACK_HOVER_WIDEN).toBe(1.5);
    expect(CRACK_HOVER_WIDEN_SECONDS).toBe(3);
    expect(CRACK_CENTER_X).toHaveLength(BUILDING_CRACKS.length);
  });
  it("returns to the original width over one second when the cursor leaves", () => {
    expect(CRACK_HOVER_SHRINK_SECONDS).toBe(1);
  });
});