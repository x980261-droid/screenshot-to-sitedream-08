import { describe, expect, it } from "vitest";
import { BOOKING_SLOTS, isFullyBooked, isPastDay, takenOn } from "@/lib/inspection-slots";

describe("booking slots", () => {
  const now = new Date(2026, 10, 27, 11, 0);
  it("offers morning and afternoon", () => expect(BOOKING_SLOTS.map((s) => s.id)).toEqual(["morning", "afternoon"]));
  it("blocks past days but allows today", () => {
    expect(isPastDay(new Date(2026, 10, 26), now)).toBe(true);
    expect(isPastDay(new Date(2026, 10, 27), now)).toBe(false);
  });
  it("day with one taken slot is still available", () =>
    expect(isFullyBooked([{ date: "2026-12-01", slot: "morning" }], "2026-12-01")).toBe(false));
  it("day with both slots taken is unavailable", () =>
    expect(isFullyBooked([{ date: "2026-12-01", slot: "morning" }, { date: "2026-12-01", slot: "afternoon" }], "2026-12-01")).toBe(true));
  it("taken slots are per date", () =>
    expect(takenOn([{ date: "2026-12-02", slot: "morning" }], "2026-12-01")).toEqual([]));
});
