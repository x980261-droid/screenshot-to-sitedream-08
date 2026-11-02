import { describe, expect, it } from "vitest";
import { FALL_DURATION_MS, FIXED_FLOORS_FROM, landingDistance, facadeDeformation } from "./building-motion";

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