import { describe, expect, it } from "vitest";
import { BOOKING_SLOTS, isFullyBooked, isPastDay, takenOn } from "@/lib/inspection-slots";

describe("booking slots", () => {
  const now = new Date(2026, 10, 27, 11, 0);
  it("offers morning, afternoon and evening", () => expect(BOOKING_SLOTS.map((s) => s.id)).toEqual(["morning", "afternoon", "evening"]));
  it("afternoon is 14:00 to 16:00", () => expect(BOOKING_SLOTS.find((s) => s.id === "afternoon")?.hours).toBe("с 14:00 до 16:00"));
  it("evening is 18:00 to 20:00", () => expect(BOOKING_SLOTS.find((s) => s.id === "evening")?.hours).toBe("с 18:00 до 20:00"));
  it("blocks past days but allows today", () => {
    expect(isPastDay(new Date(2026, 10, 26), now)).toBe(true);
    expect(isPastDay(new Date(2026, 10, 27), now)).toBe(false);
  });
  it("day with one taken slot is still available", () =>
    expect(isFullyBooked([{ date: "2026-12-01", slot: "morning" }], "2026-12-01")).toBe(false));
  it("day with only morning and afternoon taken still offers evening", () =>
    expect(isFullyBooked([{ date: "2026-12-01", slot: "morning" }, { date: "2026-12-01", slot: "afternoon" }], "2026-12-01")).toBe(false));
  it("day with all three slots taken is unavailable", () =>
    expect(isFullyBooked(BOOKING_SLOTS.map((s) => ({ date: "2026-12-01", slot: s.id })), "2026-12-01")).toBe(true));
  it("taken slots are per date", () =>
    expect(takenOn([{ date: "2026-12-02", slot: "morning" }], "2026-12-01")).toEqual([]));
});
