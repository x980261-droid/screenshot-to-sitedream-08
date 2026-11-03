import { describe, expect, it } from "vitest";
import { buildingValueAt, lifeAgeLabel } from "@/lib/building-value";

describe("Apartment date and value", () => {
  it("starts on 1 January 2008", () => {
    expect(buildingValueAt(0)).toMatchObject({ day: 1, month: 1, year: 2008 });
  });
  it("starts at 6.5 million rubles", () => {
    expect(buildingValueAt(0).price).toBe(6_500_000);
  });
  it("falls steadily to zero by 2028", () => {
    expect(buildingValueAt(90).price).toBe(3_250_000);
    expect(buildingValueAt(180)).toMatchObject({ day: 1, month: 1, year: 2028, price: 0 });
    expect(buildingValueAt(185).price).toBe(0);
  });
  it("marks the house as emergency only at the end", () => {
    expect(buildingValueAt(179.9).emergency).toBe(false);
    expect(buildingValueAt(180).emergency).toBe(true);
  });
  it("ages from 30 to 48 years over the cycle", () => {
    expect(buildingValueAt(0).ageYears).toBe(30);
    expect(lifeAgeLabel(buildingValueAt(0).ageYears)).toBe("30 лет");
    expect(buildingValueAt(90).ageYears).toBe(39);
    expect(lifeAgeLabel(buildingValueAt(90).ageYears)).toBe("39 лет");
    expect(buildingValueAt(180).ageYears).toBe(48);
    expect(lifeAgeLabel(buildingValueAt(180).ageYears)).toBe("48 лет");
    expect(lifeAgeLabel(31)).toBe("31 год");
    expect(lifeAgeLabel(34)).toBe("34 года");
  });
});