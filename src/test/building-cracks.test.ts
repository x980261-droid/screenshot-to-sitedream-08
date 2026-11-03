import { describe, expect, it } from "vitest";
import { BUILDING_CRACKS, CRACK_START_Y, crackStartSeconds, crackTipY } from "@/lib/building-cracks";

describe("Building crack rules", () => {
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
});