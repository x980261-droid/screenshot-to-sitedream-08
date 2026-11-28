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

export const CITIES = [
  { id: "moscow", label: "Москва и МО", days: [0, 1, 2] },
  { id: "lipetsk", label: "Липецк", days: [3, 4, 5] },
  { id: "voronezh", label: "Воронеж", days: [6] },
] as const;
export type CityId = (typeof CITIES)[number]["id"];

/** Only the weekdays served in the chosen city are open; nothing is open before a city is chosen. */
export function isCityDay(city: CityId | null, day: Date): boolean {
  const c = CITIES.find((x) => x.id === city);
  return !!c && (c.days as readonly number[]).includes(day.getDay());
}

export type SlotQueue = { date: string; slot: string; pending: number; closed: boolean };
export type SlotState = "free" | "booked" | "rebooked" | "closed";

/** White = free (1st), green = one pending (2nd), red = two pending (3rd), closed = 3 queued or confirmed/blocked. */
export function slotState(queue: readonly SlotQueue[], dateKey: string, slot: string): SlotState {
  const q = queue.find((x) => x.date === dateKey && x.slot === slot);
  if (!q) return "free";
  if (q.closed || q.pending >= 3) return "closed";
  return q.pending === 2 ? "rebooked" : q.pending === 1 ? "booked" : "free";
}

export function isDayClosed(queue: readonly SlotQueue[], dateKey: string): boolean {
  return BOOKING_SLOTS.every((b) => slotState(queue, dateKey, b.id) === "closed");
}
