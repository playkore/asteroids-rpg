import type { AsteroidSize } from './types';

export const SHIP_RADIUS = 12;
export const SHIP_DRAG = 0.992;
export const SHIP_MAX_SPEED = 260;
export const SHIP_JOYSTICK_RESPONSE = 0.2;
export const SHIP_KEYBOARD_ROTATION_SPEED = 4.2;
export const SHIP_KEYBOARD_THRUST = 240;
export const BULLET_SPEED = 560;
export const BULLET_LIFE = 1.05;
export const SHOOT_COOLDOWN = 0.18;
export const INVULNERABILITY_TIME = 2.2;
export const RESPAWN_DELAY = 1.1;
export const WAVE_DELAY = 1.3;

export const ASTEROID_RADIUS: Record<AsteroidSize, number> = {
  3: 56,
  2: 34,
  1: 20,
};

export const ASTEROID_SPEED: Record<AsteroidSize, number> = {
  3: 62,
  2: 92,
  1: 122,
};
