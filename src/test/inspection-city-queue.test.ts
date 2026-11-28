import { expect, it } from "vitest";
import { isCityDay, slotState } from "@/lib/inspection-slots";

const day = (dow: number) => new Date(2026, 10, 29 + dow); // 29 Nov 2026 is Sunday
it("no city opens no days", () => expect([0, 1, 2, 3, 4, 5, 6].some((d) => isCityDay(null, day(d)))).toBe(false));
it("Moscow: Sun, Mon, Tue", () => expect([0, 1, 2, 3, 4, 5, 6].filter((d) => isCityDay("moscow", day(d)))).toEqual([0, 1, 2]));
it("Lipetsk: Wed, Thu, Fri", () => expect([0, 1, 2, 3, 4, 5, 6].filter((d) => isCityDay("lipetsk", day(d)))).toEqual([3, 4, 5]));
it("Voronezh: Sat", () => expect([0, 1, 2, 3, 4, 5, 6].filter((d) => isCityDay("voronezh", day(d)))).toEqual([6]));
const q = (pending: number, closed = false) => [{ date: "2026-12-01", slot: "morning", pending, closed }];
it("0 bookings is white/free", () => expect(slotState([], "2026-12-01", "morning")).toBe("free"));
it("1 pending is green", () => expect(slotState(q(1), "2026-12-01", "morning")).toBe("booked"));
it("2 pending is red", () => expect(slotState(q(2), "2026-12-01", "morning")).toBe("rebooked"));
it("3 pending is closed", () => expect(slotState(q(3), "2026-12-01", "morning")).toBe("closed"));
it("confirmed closes the time", () => expect(slotState(q(1, true), "2026-12-01", "morning")).toBe("closed"));
