import { describe, expect, it } from "vitest";
import { INSPECTION_SLOTS, isPastDay, slotStates } from "@/lib/inspection-slots";

describe("inspection slots", () => {
  const now = new Date(2026, 10, 27, 11, 0);
  it("offers 10:00 and 15:00", () => expect([...INSPECTION_SLOTS]).toEqual(["10:00", "15:00"]));
  it("blocks past days but allows today", () => {
    expect(isPastDay(new Date(2026, 10, 26), now)).toBe(true);
    expect(isPastDay(new Date(2026, 10, 27), now)).toBe(false);
  });
  it("marks booked slots as taken", () =>
    expect(slotStates(["15:00"])).toEqual([{ time: "10:00", booked: false }, { time: "15:00", booked: true }]));
});
