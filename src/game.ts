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

export function createGameState(width: number, height: number): GameState {
  return {
    ship: {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      invulnerableUntil: 0,
      alive: true,
    },
    bullets: [],
    asteroids: spawnWave(width, height, 1),
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
  if (state.ship.x === 0 && state.ship.y === 0) {
    state.ship.x = width / 2;
    state.ship.y = height / 2;
  } else {
    state.ship.x = wrap(state.ship.x, width);
    state.ship.y = wrap(state.ship.y, height);
  }
}

export function restartGame(state: GameState) {
  const fresh = createGameState(state.width, state.height);
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

  state.ship.vx *= SHIP_DRAG;
  state.ship.vy *= SHIP_DRAG;
  state.ship.x = wrap(state.ship.x + state.ship.vx * dt, state.width);
  state.ship.y = wrap(state.ship.y + state.ship.vy * dt, state.height);

  if (state.ship.alive && now >= state.ship.invulnerableUntil) {
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
    bullet.x = wrap(bullet.x + bullet.vx * dt, state.width);
    bullet.y = wrap(bullet.y + bullet.vy * dt, state.height);
    bullet.life -= dt;
  }
  state.bullets = state.bullets.filter((bullet) => bullet.life > 0);

  for (const asteroid of state.asteroids) {
    asteroid.x = wrap(asteroid.x + asteroid.vx * dt, state.width);
    asteroid.y = wrap(asteroid.y + asteroid.vy * dt, state.height);
  }

  resolveBulletHits(state);

  if (!state.ship.alive && state.respawnAt > 0 && now >= state.respawnAt) {
    state.ship.x = state.width / 2;
    state.ship.y = state.height / 2;
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
    state.asteroids = spawnWave(state.width, state.height, state.wave);
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
  state.bullets.push({
    x: state.ship.x + Math.cos(state.ship.angle) * muzzleDistance,
    y: state.ship.y + Math.sin(state.ship.angle) * muzzleDistance,
    vx: Math.cos(state.ship.angle) * BULLET_SPEED + state.ship.vx,
    vy: Math.sin(state.ship.angle) * BULLET_SPEED + state.ship.vy,
    life: BULLET_LIFE,
  });
  state.nextShotAt = now + SHOOT_COOLDOWN * 1000;
}

function resolveBulletHits(state: GameState) {
  const remainingBullets: Bullet[] = [];
  const remainingAsteroids: Asteroid[] = [];
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
          const spread = Math.random() * Math.PI * 2;
          const speed = ASTEROID_SPEED[nextSize];
          for (const direction of [-1, 1]) {
            remainingAsteroids.push({
              x: asteroid.x,
              y: asteroid.y,
              vx: Math.cos(spread + direction * 0.7) * speed + asteroid.vx * 0.4,
              vy: Math.sin(spread + direction * 0.7) * speed + asteroid.vy * 0.4,
              size: nextSize,
              radius: ASTEROID_RADIUS[nextSize],
            });
          }
        }
        break;
      }
    }
    if (!hit) {
      remainingBullets.push(bullet);
    }
  }

  for (const asteroid of state.asteroids) {
    if (!destroyed.has(asteroid)) {
      remainingAsteroids.push(asteroid);
    }
  }

  state.bullets = remainingBullets;
  state.asteroids = remainingAsteroids;
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

function spawnWave(width: number, height: number, wave: number): Asteroid[] {
  const count = Math.min(4 + wave, 10);
  const asteroids: Asteroid[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(width, height) * (0.25 + Math.random() * 0.35);
    const x = width / 2 + Math.cos(angle) * dist;
    const y = height / 2 + Math.sin(angle) * dist;
    const vxAngle = Math.random() * Math.PI * 2;
    const size: AsteroidSize = Math.random() > 0.7 ? 2 : 3;
    const speed = ASTEROID_SPEED[size] * (0.55 + wave * 0.03);
    asteroids.push({
      x: wrap(x, width),
      y: wrap(y, height),
      vx: Math.cos(vxAngle) * speed,
      vy: Math.sin(vxAngle) * speed,
      size,
      radius: ASTEROID_RADIUS[size],
    });
  }
  return asteroids;
}

function asteroidShape(radius: number) {
  const segments = 9;
  return Array.from({ length: segments }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2;
    const distance = 0.78 + 0.27 * Math.sin(radius * 0.11 + index * 2.1);
    return { angle, distance };
  });
}

export function wrap(value: number, max: number) {
  if (value < 0) return value + max;
  if (value > max) return value - max;
  return value;
}

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
