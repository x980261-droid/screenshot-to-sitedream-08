export const INSPECTION_SLOTS = ["10:00", "15:00"] as const;
export type InspectionSlot = (typeof INSPECTION_SLOTS)[number];

/** True when the day is before today (local calendar day). */
export function isPastDay(day: Date, now: Date = new Date()): boolean {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d < t;
}

export function slotStates(booked: readonly string[]) {
  return INSPECTION_SLOTS.map((time) => ({ time, booked: booked.includes(time) }));
}

/** yyyy-mm-dd in local time, for storing a calendar day. */
export function toDateKey(day: Date): string {
  const m = String(day.getMonth() + 1).padStart(2, "0");
  const d = String(day.getDate()).padStart(2, "0");
  return `${day.getFullYear()}-${m}-${d}`;
}
