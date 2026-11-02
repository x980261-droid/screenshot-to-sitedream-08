export const FALL_DURATION_MS = 3000;
export const FIXED_FLOORS_FROM = 410;
export const SCENE_HEIGHT = 623;

export function landingDistance(top: number, height: number) {
  return Math.max(0, SCENE_HEIGHT - 30 - top - height);
}