import { CRACK_REVEAL_SECONDS } from "@/lib/building-cracks";

export const APARTMENT_INITIAL_PRICE = 6_500_000;
const START_DATE = Date.UTC(2008, 0, 1);
const END_DATE = Date.UTC(2028, 0, 1);
const DAY_MS = 86_400_000;

export function buildingValueAt(elapsedSeconds: number) {
  const progress = Math.min(1, Math.max(0, elapsedSeconds / CRACK_REVEAL_SECONDS));
  const date = new Date(START_DATE + Math.floor((END_DATE - START_DATE) * progress / DAY_MS) * DAY_MS);
  return {
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
    price: Math.round(APARTMENT_INITIAL_PRICE * (1 - progress)),
    deformationPercent: Math.round(progress * 100),
    emergency: progress === 1,
    ageYears: 30 + 20 * progress,
  };
}

export function lifeAgeLabel(ageYears: number) {
  const age = Math.min(50, Math.floor(ageYears));
  const mod10 = age % 10;
  const mod100 = age % 100;
  const unit = mod10 === 1 && mod100 !== 11 ? "год" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "года" : "лет";
  return `${age} ${unit}`;
}