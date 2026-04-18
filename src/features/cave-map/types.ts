export type Vector = {
  x: number;
  y: number;
};

export type Ship = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  invulnerableUntil: number;
  alive: boolean;
};

export type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

export type AsteroidSize = 3 | 2 | 1;

export type Asteroid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: AsteroidSize;
  radius: number;
};

export type GameState = {
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  score: number;
  lives: number;
  wave: number;
  gameOver: boolean;
  width: number;
  height: number;
  nextShotAt: number;
  respawnAt: number;
  waveClearAt: number;
};

export type InputState = {
  moveX: number;
  moveY: number;
  shootHeld: boolean;
  shootRequested: boolean;
  pauseRequested: boolean;
  keyboard: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    shoot: boolean;
    restart: boolean;
  };
};

export type HudState = {
  score: number;
  lives: number;
  wave: number;
  gameOver: boolean;
  ready: boolean;
};
