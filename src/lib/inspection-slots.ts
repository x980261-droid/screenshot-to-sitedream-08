export const BOOKING_SLOTS = [
  { id: "morning", label: "Утро", hours: "с 8:00 до 10:00", note: "Приемка 2 часа" },
  { id: "afternoon", label: "После обеда", hours: "с 14:00 до 16:00", note: "Приемка 2 часа" },
  { id: "evening", label: "Вечер", hours: "с 18:00 до 20:00", note: "Приемка 2 часа" },
] as const;
export type BookingSlotId = (typeof BOOKING_SLOTS)[number]["id"];
export type TakenSlot = { date: string; slot: string };

/** True when the day is before today (local calendar day). */
export function isPastDay(day: Date, now: Date = new Date()): boolean {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d < t;
}

/** yyyy-mm-dd in local time. */
export function toDateKey(day: Date): string {
  const m = String(day.getMonth() + 1).padStart(2, "0");
  const d = String(day.getDate()).padStart(2, "0");
  return `${day.getFullYear()}-${m}-${d}`;
}

export function takenOn(taken: readonly TakenSlot[], dateKey: string): string[] {
  return taken.filter((t) => t.date === dateKey).map((t) => t.slot);
}

/** A day is fully booked when every slot is taken. */
export function isFullyBooked(taken: readonly TakenSlot[], dateKey: string): boolean {
  const s = takenOn(taken, dateKey);
  return BOOKING_SLOTS.every((b) => s.includes(b.id));
}
