import { generateCave } from './cave';
import { createSeededRandom, generateSeed } from './seed';

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
  seed: string;
  random: () => number;
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  cave: Vector[];
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

const SHIP_RADIUS = 12;
const SHIP_DRAG = 0.992;
const SHIP_MAX_SPEED = 260;
const SHIP_JOYSTICK_RESPONSE = 0.2;
const SHIP_KEYBOARD_ROTATION_SPEED = 4.2;
const SHIP_KEYBOARD_THRUST = 240;
const BULLET_SPEED = 560;
const BULLET_LIFE = 1.05;
const SHOOT_COOLDOWN = 0.18;
const INVULNERABILITY_TIME = 2.2;
const RESPAWN_DELAY = 1.1;
const WAVE_DELAY = 1.3;
const SPAWN_SAFE_RADIUS = 260;

const ASTEROID_RADIUS: Record<AsteroidSize, number> = {
  3: 56,
  2: 34,
  1: 20,
};

const ASTEROID_SPEED: Record<AsteroidSize, number> = {
  3: 62,
  2: 92,
  1: 122,
};

const bulletPool: Bullet[] = [];
const asteroidPool: Asteroid[] = [];
const bulletResolveBuffers: [Bullet[], Bullet[]] = [[], []];
const asteroidResolveBuffers: [Asteroid[], Asteroid[]] = [[], []];
let resolveBufferIndex = 0;

export function createInputState(): InputState {
  return {
    moveX: 0,
    moveY: 0,
    shootHeld: false,
    shootRequested: false,
    pauseRequested: false,
    keyboard: {
      left: false,
      right: false,
      up: false,
      down: false,
      shoot: false,
      restart: false,
    },
  };
}

export function createGameState(width: number, height: number, seed = generateSeed()): GameState {
  const random = createSeededRandom(seed);
  const cave = generateCave(random);
  return {
    seed,
    random,
    ship: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      invulnerableUntil: 0,
      alive: true,
    },
    bullets: [],
    asteroids: spawnWave(1, cave, random),
    cave,
    score: 0,
    lives: 3,
    wave: 1,
    gameOver: false,
    width,
    height,
    nextShotAt: 0,
    respawnAt: 0,
    waveClearAt: 0,
  };
}

export function resizeGameState(state: GameState, width: number, height: number) {
  state.width = width;
  state.height = height;
}

export function restartGame(state: GameState) {
  releaseBullets(state.bullets);
  releaseAsteroids(state.asteroids);
  const fresh = createGameState(state.width, state.height, state.seed);
  Object.assign(state, fresh);
}

export function updateGame(
  state: GameState,
  input: InputState,
  dt: number,
  now: number,
): HudState {
  if (input.keyboard.restart || (state.gameOver && input.shootRequested)) {
    restartGame(state);
    input.keyboard.restart = false;
    input.shootRequested = false;
  }

  if (state.gameOver) {
    return {
      score: state.score,
      lives: state.lives,
      wave: state.wave,
      gameOver: true,
      ready: false,
    };
  }

  const moveX = clamp(input.moveX, -1, 1);
  const moveY = clamp(input.moveY, -1, 1);
  const moveMagnitude = Math.min(Math.hypot(moveX, moveY), 1);

  const keyboardTurn = (input.keyboard.right ? 1 : 0) - (input.keyboard.left ? 1 : 0);
  const keyboardThrust = input.keyboard.up ? 1 : 0;

  if (state.ship.alive && moveMagnitude > 0.01) {
    const normalizedX = moveX / Math.max(moveMagnitude, 0.0001);
    const normalizedY = moveY / Math.max(moveMagnitude, 0.0001);
    const targetVx = normalizedX * SHIP_MAX_SPEED * moveMagnitude;
    const targetVy = normalizedY * SHIP_MAX_SPEED * moveMagnitude;
    state.ship.vx += (targetVx - state.ship.vx) * SHIP_JOYSTICK_RESPONSE;
    state.ship.vy += (targetVy - state.ship.vy) * SHIP_JOYSTICK_RESPONSE;
    state.ship.angle = Math.atan2(state.ship.vy, state.ship.vx);
  }

  if (state.ship.alive && keyboardTurn !== 0) {
    state.ship.angle += keyboardTurn * SHIP_KEYBOARD_ROTATION_SPEED * dt;
  }

  if (state.ship.alive && keyboardThrust > 0) {
    const accel = SHIP_KEYBOARD_THRUST * keyboardThrust;
    state.ship.vx += Math.cos(state.ship.angle) * accel * dt;
    state.ship.vy += Math.sin(state.ship.angle) * accel * dt;
  }

  const shipStartX = state.ship.x;
  const shipStartY = state.ship.y;
  state.ship.vx *= SHIP_DRAG;
  state.ship.vy *= SHIP_DRAG;
  state.ship.x += state.ship.vx * dt;
  state.ship.y += state.ship.vy * dt;
  const shipEndX = state.ship.x;
  const shipEndY = state.ship.y;

  if (
    state.ship.alive &&
    now >= state.ship.invulnerableUntil &&
    movementHitsCave(state.cave, shipStartX, shipStartY, shipEndX, shipEndY)
  ) {
    state.ship.x = shipStartX;
    state.ship.y = shipStartY;
    reflectVelocity(state.ship, state.cave, shipStartX, shipStartY, shipEndX, shipEndY);
  } else if (state.ship.alive && now >= state.ship.invulnerableUntil) {
    for (const asteroid of state.asteroids) {
      if (distanceSquared(state.ship.x, state.ship.y, asteroid.x, asteroid.y) < Math.pow(SHIP_RADIUS + asteroid.radius, 2)) {
        loseLife(state, now);
        break;
      }
    }
  }

  if (input.shootRequested || input.keyboard.shoot || input.shootHeld) {
    tryShoot(state, now);
  }

  input.shootRequested = false;
  input.keyboard.shoot = false;
  input.keyboard.restart = false;

  for (const bullet of state.bullets) {
    const bulletStartX = bullet.x;
    const bulletStartY = bullet.y;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    if (movementHitsCave(state.cave, bulletStartX, bulletStartY, bullet.x, bullet.y)) {
      bullet.life = 0;
    }
  }
  state.bullets = compactBullets(state.bullets);

  for (const asteroid of state.asteroids) {
    const asteroidStartX = asteroid.x;
    const asteroidStartY = asteroid.y;
    asteroid.x += asteroid.vx * dt;
    asteroid.y += asteroid.vy * dt;
    bounceAsteroidOffCave(state.cave, asteroid, asteroidStartX, asteroidStartY, asteroid.x, asteroid.y);
  }

  resolveBulletHits(state);

  if (!state.ship.alive && state.respawnAt > 0 && now >= state.respawnAt) {
    state.ship.x = 0;
    state.ship.y = 0;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.ship.alive = true;
    state.ship.invulnerableUntil = now + INVULNERABILITY_TIME;
    state.respawnAt = 0;
  }

  if (state.asteroids.length === 0 && state.waveClearAt === 0) {
    state.waveClearAt = now + WAVE_DELAY;
  }

  if (state.waveClearAt > 0 && now >= state.waveClearAt) {
    state.wave += 1;
    state.asteroids = spawnWave(state.wave, state.cave, state.random);
    state.waveClearAt = 0;
    state.ship.invulnerableUntil = now + INVULNERABILITY_TIME;
  }

  return {
    score: state.score,
    lives: state.lives,
    wave: state.wave,
    gameOver: state.gameOver,
    ready: !state.gameOver && state.ship.alive && now >= state.ship.invulnerableUntil,
  };
}

function tryShoot(state: GameState, now: number) {
  if (!state.ship.alive || now < state.nextShotAt) {
    return;
  }

  const muzzleDistance = 16;
  const bullet = acquireBullet();
  bullet.x = state.ship.x + Math.cos(state.ship.angle) * muzzleDistance;
  bullet.y = state.ship.y + Math.sin(state.ship.angle) * muzzleDistance;
  bullet.vx = Math.cos(state.ship.angle) * BULLET_SPEED + state.ship.vx;
  bullet.vy = Math.sin(state.ship.angle) * BULLET_SPEED + state.ship.vy;
  bullet.life = BULLET_LIFE;
  state.bullets.push(bullet);
  state.nextShotAt = now + SHOOT_COOLDOWN * 1000;
}

function resolveBulletHits(state: GameState) {
  const nextIndex = resolveBufferIndex ^ 1;
  const remainingBullets = bulletResolveBuffers[nextIndex]!;
  const remainingAsteroids = asteroidResolveBuffers[nextIndex]!;
  remainingBullets.length = 0;
  remainingAsteroids.length = 0;
  const destroyed = new Set<Asteroid>();

  for (const bullet of state.bullets) {
    let hit = false;
    for (const asteroid of state.asteroids) {
      if (destroyed.has(asteroid)) continue;
      if (distanceSquared(bullet.x, bullet.y, asteroid.x, asteroid.y) <= asteroid.radius * asteroid.radius) {
        hit = true;
        destroyed.add(asteroid);
        state.score += asteroid.size * 100;
        if (asteroid.size > 1) {
          const nextSize = (asteroid.size - 1) as AsteroidSize;
          const spread = state.random() * Math.PI * 2;
          const speed = ASTEROID_SPEED[nextSize];
          for (const direction of [-1, 1]) {
            const splitAsteroid = acquireAsteroid();
            splitAsteroid.x = asteroid.x;
            splitAsteroid.y = asteroid.y;
            splitAsteroid.vx = Math.cos(spread + direction * 0.7) * speed + asteroid.vx * 0.4;
            splitAsteroid.vy = Math.sin(spread + direction * 0.7) * speed + asteroid.vy * 0.4;
            splitAsteroid.size = nextSize;
            splitAsteroid.radius = ASTEROID_RADIUS[nextSize];
            remainingAsteroids.push(splitAsteroid);
          }
        }
        break;
      }
    }
    if (!hit) {
      remainingBullets.push(bullet);
    } else {
      releaseBullet(bullet);
    }
  }

  for (const asteroid of state.asteroids) {
    if (!destroyed.has(asteroid)) {
      remainingAsteroids.push(asteroid);
    } else {
      releaseAsteroid(asteroid);
    }
  }

  state.bullets = remainingBullets;
  state.asteroids = remainingAsteroids;
  resolveBufferIndex = nextIndex;
}

export function loseLife(state: GameState, now: number) {
  if (now < state.ship.invulnerableUntil) {
    return;
  }
  state.lives -= 1;
  state.ship.alive = false;
  state.respawnAt = now + RESPAWN_DELAY;
  state.ship.invulnerableUntil = now + RESPAWN_DELAY;
  if (state.lives <= 0) {
    state.gameOver = true;
  }
}

function isPointInPolygon(px: number, py: number, polygon: Vector[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pI = polygon[i]!;
    const pJ = polygon[j]!;
    const intersect = ((pI.y > py) !== (pJ.y > py)) && (px < (pJ.x - pI.x) * (py - pI.y) / (pJ.y - pI.y) + pI.x);
    if (intersect) inside = !inside;
  }
  return inside;
}

function spawnWave(wave: number, cave: Vector[], random: () => number): Asteroid[] {
  const count = Math.min(4 + wave, 10);
  const asteroids: Asteroid[] = [];
  let attempts = 0;
  for (let i = 0; i < count && attempts < 5000; ) {
    attempts += 1;
    let x = 0;
    let y = 0;
    let valid = false;
    for (let tries = 0; tries < 200; tries += 1) {
      const angle = random() * Math.PI * 2;
      const dist = 200 + random() * 2500;
      const testX = Math.cos(angle) * dist;
      const testY = Math.sin(angle) * dist;
      if (
        (cave.length === 0 || isPointInPolygon(testX, testY, cave)) &&
        Math.hypot(testX, testY) > SPAWN_SAFE_RADIUS
      ) {
        x = testX;
        y = testY;
        valid = true;
        break;
      }
    }

    if (!valid) {
      continue;
    }

    const vxAngle = random() * Math.PI * 2;
    const size: AsteroidSize = random() > 0.7 ? 2 : 3;
    const speed = ASTEROID_SPEED[size] * (0.55 + wave * 0.03);
    const asteroid = acquireAsteroid();
    asteroid.x = x;
    asteroid.y = y;
    asteroid.vx = Math.cos(vxAngle) * speed;
    asteroid.vy = Math.sin(vxAngle) * speed;
    asteroid.size = size;
    asteroid.radius = ASTEROID_RADIUS[size];
    asteroids.push(asteroid);
    i += 1;
  }
  return asteroids;
}

function compactBullets(bullets: Bullet[]) {
  let writeIndex = 0;
  for (const bullet of bullets) {
    if (bullet.life > 0) {
      bullets[writeIndex] = bullet;
      writeIndex += 1;
    } else {
      releaseBullet(bullet);
    }
  }
  bullets.length = writeIndex;
  return bullets;
}

function acquireBullet() {
  const bullet = bulletPool.pop();
  return bullet ?? { x: 0, y: 0, vx: 0, vy: 0, life: 0 };
}

function releaseBullet(bullet: Bullet) {
  bulletPool.push(bullet);
}

function releaseBullets(bullets: Bullet[]) {
  for (const bullet of bullets) {
    releaseBullet(bullet);
  }
}

function acquireAsteroid() {
  const asteroid = asteroidPool.pop();
  return asteroid ?? { x: 0, y: 0, vx: 0, vy: 0, size: 3, radius: ASTEROID_RADIUS[3] };
}

function releaseAsteroid(asteroid: Asteroid) {
  asteroidPool.push(asteroid);
}

function releaseAsteroids(asteroids: Asteroid[]) {
  for (const asteroid of asteroids) {
    releaseAsteroid(asteroid);
  }
}

function movementHitsCave(cave: Vector[], startX: number, startY: number, endX: number, endY: number) {
  return findWallHit(cave, startX, startY, endX, endY) !== null;
}

function bounceAsteroidOffCave(
  cave: Vector[],
  asteroid: Asteroid,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const hit = findWallHit(cave, startX, startY, endX, endY);
  if (!hit) {
    return;
  }

  asteroid.x = startX;
  asteroid.y = startY;
  reflectVelocity(asteroid, cave, startX, startY, endX, endY);
}

function findWallHit(cave: Vector[], startX: number, startY: number, endX: number, endY: number) {
  for (let i = 0; i < cave.length; i += 1) {
    const a = cave[i]!;
    const b = cave[(i + 1) % cave.length]!;
    if (!linesIntersect(startX, startY, endX, endY, a.x, a.y, b.x, b.y)) {
      continue;
    }

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    return {
      ax: a.x,
      ay: a.y,
      bx: b.x,
      by: b.y,
      nx: (-dy / length),
      ny: dx / length,
    };
  }

  return null;
}

function asteroidShape(radius: number) {
  const segments = 9;
  return Array.from({ length: segments }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2;
    const distance = 0.78 + 0.27 * Math.sin(radius * 0.11 + index * 2.1);
    return { angle, distance };
  });
}

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function linesIntersect(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number,
  p4x: number,
  p4y: number,
) {
  const d1 = direction(p3x, p3y, p4x, p4y, p1x, p1y);
  const d2 = direction(p3x, p3y, p4x, p4y, p2x, p2y);
  const d3 = direction(p1x, p1y, p2x, p2y, p3x, p3y);
  const d4 = direction(p1x, p1y, p2x, p2y, p4x, p4y);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (d1 === 0 && onSegment(p3x, p3y, p4x, p4y, p1x, p1y)) return true;
  if (d2 === 0 && onSegment(p3x, p3y, p4x, p4y, p2x, p2y)) return true;
  if (d3 === 0 && onSegment(p1x, p1y, p2x, p2y, p3x, p3y)) return true;
  if (d4 === 0 && onSegment(p1x, p1y, p2x, p2y, p4x, p4y)) return true;

  return false;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function reflectVelocity(
  entity: { vx: number; vy: number },
  cave: Vector[],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const hit = findWallHit(cave, startX, startY, endX, endY);
  if (!hit) {
    return;
  }

  const dot = entity.vx * hit.nx + entity.vy * hit.ny;
  entity.vx -= 2 * dot * hit.nx;
  entity.vy -= 2 * dot * hit.ny;
}

function direction(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  return (cx - ax) * (by - ay) - (cy - ay) * (bx - ax);
}

function onSegment(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  return Math.min(ax, bx) <= cx && cx <= Math.max(ax, bx) && Math.min(ay, by) <= cy && cy <= Math.max(ay, by);
}
