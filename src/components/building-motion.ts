export const FALL_DURATION_MS = 3000;
export const FIXED_FLOORS_FROM = 410;
export const SCENE_HEIGHT = 623;

export function landingDistance(top: number, height: number) {
  return Math.max(0, SCENE_HEIGHT - 30 - top - height);
}

export function facadeDeformation(intensity: number, drop: number, rotation: number) {
  const progress = Math.max(0, Math.min(1, intensity));
  return {
    drop: Math.min(12, Math.max(0, drop)) * progress,
    rotation: Math.max(-2, Math.min(2, rotation)) * progress,
    opacity: 1,
  };
}