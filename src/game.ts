import { createSeededRandom, generateSeed, normalizeSeed } from './seed';
import { createPlayerStats, gainPlayerXp, type PlayerStats } from './rpg';
import type { SaveSlotData, SaveSlotIndex } from './save';

export type Vector = {
  x: number;
  y: number;
};

export type CellCoord = {
  x: number;
  y: number;
};

export type AsteroidSize = 3 | 2 | 1;

export type ParticleKind = 'spark' | 'debris' | 'muzzle' | 'burst';

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: ParticleKind;
};

export type ScreenShake = {
  amplitude: number;
  until: number;
};

export type FlashEffect = {
  x: number;
  y: number;
  radius: number;
  until: number;
};

export type RemainingAsteroids = Record<AsteroidSize, number>;

export type CellKind = 'empty' | 'combat';

export type CellState = {
  kind: CellKind;
  visited: boolean;
  cleared: boolean;
  remaining: RemainingAsteroids;
};

export type Ship = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  invulnerableUntil: number;
  alive: boolean;
  recoilUntil?: number;
};

export type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  trailUntil?: number;
};

export type Asteroid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: AsteroidSize;
  radius: number;
  hp: number;
  maxHp: number;
  xpReward: number;
  contactDamage: number;
  hpVisible: boolean;
  hitFlashUntil?: number;
  hitScaleUntil?: number;
};

export type GameState = {
  seed: string;
  slotIndex: SaveSlotIndex | null;
  currentCell: CellCoord;
  lastClearedCell: CellCoord;
  cells: Record<string, CellState>;
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  particles: Particle[];
  flashes: FlashEffect[];
  shake: ScreenShake;
  player: PlayerStats;
  gameOver: boolean;
  respawnBlinkUntil: number;
  width: number;
  height: number;
  nextShotAt: number;
  transitionCooldownUntil: number;
  regenAccumulator: number;
  spawnCounter: number;
  saveRequested: boolean;
};

export type MapState = {
  seed: string;
  currentCell: CellCoord;
  cells: Record<string, CellState>;
};

export type HudState = {
  player: PlayerStats;
  seed: string;
  gameOver: boolean;
  ready: boolean;
  cell: CellCoord;
  cellLevel: number;
  sectorAsteroidHpCurrent: number;
  sectorAsteroidHpTotal: number;
  sectorHasAsteroids: boolean;
  slotIndex: SaveSlotIndex | null;
};

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover';

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

type CreateGameStateOptions = {
  slotIndex?: SaveSlotIndex | null;
  currentCell?: CellCoord;
  player?: PlayerStats;
  cells?: Record<string, CellState>;
  ship?: Partial<Ship>;
  bullets?: Bullet[];
  asteroids?: Asteroid[];
  gameOver?: boolean;
  lastClearedCell?: CellCoord;
  nextShotAt?: number;
  transitionCooldownUntil?: number;
  regenAccumulator?: number;
  spawnCounter?: number;
  saveRequested?: boolean;
};

type CellSpawnContext = {
  cell: CellCoord;
  level: number;
  seed: string;
  spawnCounter: number;
  width: number;
  height: number;
};

const SHIP_RADIUS = 12;
const SHIP_DRAG = 0.992;
const SHIP_MAX_SPEED = 220;
const SHIP_JOYSTICK_RESPONSE = 0.2;
const SHIP_KEYBOARD_ROTATION_SPEED = 4.2;
const SHIP_KEYBOARD_THRUST = 240;
const BULLET_SPEED = 560;
const BULLET_SPREAD = 0.04;
const BULLET_LIFE = 1.05;
const SHOOT_COOLDOWN = 0.18;
const MUZZLE_FLASH_TIME = 0.05;
const HIT_FLASH_TIME = 0.08;
const HIT_SCALE_TIME = 0.09;
const FLAME_THRUST_TIME = 0.09;
const DAMAGE_INVULNERABILITY_TIME = 1.4;
const TRANSITION_INVULNERABILITY_TIME = 0.25;
const CELL_CLEAR_XP = 3;
const CELL_CLEAR_HEAL = 2;
const PASSIVE_REGEN_INTERVAL_MS = 10000;
const PASSIVE_REGEN_AMOUNT = 1;
const WORLD_WIDTH = 7;
const WORLD_MIN_Y = -4;
const RESPAWN_BLINK_TIME = 3.5;

const ASTEROID_RADIUS: Record<AsteroidSize, number> = {
  3: 56,
  2: 34,
  1: 20,
};

const ASTEROID_SPEED: Record<AsteroidSize, number> = {
  3: 56,
  2: 112,
  1: 224,
};

const ASTEROID_XP_REWARD: Record<AsteroidSize, number> = {
  3: 4,
  2: 2,
  1: 1,
};

const SHIP_MASS = 1;
const ASTEROID_MASS: Record<AsteroidSize, number> = {
  3: 9,
  2: 3,
  1: 1,
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

export function createGameState(
  width: number,
  height: number,
  seed = generateSeed(),
  options: CreateGameStateOptions = {},
): GameState {
  const state: GameState = {
    seed: normalizeSeed(seed),
    slotIndex: options.slotIndex ?? null,
    currentCell: options.currentCell ? normalizeCellCoord(options.currentCell) : { x: 0, y: 0 },
    lastClearedCell: options.lastClearedCell
      ? normalizeCellCoord(options.lastClearedCell)
      : options.currentCell
        ? normalizeCellCoord(options.currentCell)
        : { x: 0, y: 0 },
    cells: cloneCellStateMap(options.cells ?? {}),
    ship: {
      x: Math.floor(width / 2),
      y: Math.floor(height / 2),
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      invulnerableUntil: 0,
      alive: true,
      recoilUntil: 0,
      ...options.ship,
    },
    bullets: cloneBullets(options.bullets ?? []),
    asteroids: cloneAsteroids(options.asteroids ?? []),
    particles: [],
    flashes: [],
    shake: {
      amplitude: 0,
      until: 0,
    },
    player: options.player ? { ...options.player } : createPlayerStats(),
    gameOver: options.gameOver ?? false,
    respawnBlinkUntil: 0,
    width,
    height,
    nextShotAt: options.nextShotAt ?? 0,
    transitionCooldownUntil: options.transitionCooldownUntil ?? 0,
    regenAccumulator: options.regenAccumulator ?? 0,
    spawnCounter: options.spawnCounter ?? 0,
    saveRequested: options.saveRequested ?? false,
  };

  if (options.cells && options.currentCell) {
    ensureCellLoaded(state, state.currentCell, true);
  } else {
    enterCell(state, state.currentCell, 0, true);
  }

  return state;
}

export function hydrateGameState(
  snapshot: SaveSlotData,
  width = snapshot.width,
  height = snapshot.height,
): GameState {
  return createGameState(width, height, snapshot.seed, {
    slotIndex: null,
    currentCell: snapshot.currentCell,
    lastClearedCell: snapshot.lastClearedCell ?? snapshot.currentCell,
    player: snapshot.player,
    cells: snapshot.cells,
    ship: {
      ...snapshot.ship,
      invulnerableUntil: 0,
      recoilUntil: 0,
    },
    gameOver: false,
    nextShotAt: 0,
    transitionCooldownUntil: 0,
    regenAccumulator: snapshot.regenAccumulator,
    spawnCounter: snapshot.spawnCounter,
  });
}

export function resizeGameState(state: GameState, width: number, height: number) {
  state.width = width;
  state.height = height;
  state.ship.x = clamp(state.ship.x, 0, width);
  state.ship.y = clamp(state.ship.y, 0, height);
}

export function restartGame(state: GameState) {
  const fresh = createGameState(state.width, state.height, state.seed, {
    slotIndex: state.slotIndex,
  });
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
    return buildHudState(state, false);
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
  state.ship.x += state.ship.vx * dt;
  state.ship.y += state.ship.vy * dt;

  if (input.shootRequested || input.keyboard.shoot || input.shootHeld) {
    tryShoot(state, now);
  }

  input.shootRequested = false;
  input.keyboard.shoot = false;
  input.keyboard.restart = false;
  input.pauseRequested = false;

  updateBullets(state, dt);
  updateAsteroids(state, dt);
  updateParticles(state, dt);
  resolveBulletHits(state, now);
  handleClearCell(state);
  updatePassiveRegen(state, dt);
  updateTransientFeedback(state, now);

  if (state.ship.alive && now >= state.transitionCooldownUntil) {
    handleCellTransitions(state, now);
  }

  if (state.ship.alive && now >= state.ship.invulnerableUntil) {
    resolveShipAsteroidContacts(state, now);
  }

  if (state.gameOver) {
    return buildHudState(state, false);
  }

  return buildHudState(state, state.ship.alive && now >= state.ship.invulnerableUntil);
}

export function shouldAutoShoot(state: GameState) {
  return !state.gameOver && state.asteroids.length > 0;
}

export function buildMapState(state: GameState): MapState {
  return {
    seed: state.seed,
    currentCell: { ...state.currentCell },
    cells: state.cells,
  };
}

export function buildHudState(state: GameState, ready: boolean): HudState {
  const currentCell = state.cells[cellKey(state.currentCell)];
  const sectorHp = summarizeSectorAsteroidHp(
    state.asteroids,
    getCellLevel(state.currentCell),
    currentCell?.remaining,
  );
  return {
    player: state.player,
    seed: state.seed,
    gameOver: state.gameOver,
    ready,
    cell: { ...state.currentCell },
    cellLevel: getCellLevel(state.currentCell),
    sectorAsteroidHpCurrent: sectorHp.currentHp,
    sectorAsteroidHpTotal: sectorHp.totalHp,
    sectorHasAsteroids: sectorHp.hasAsteroids,
    slotIndex: state.slotIndex,
  };
}

export function cellKey(cell: CellCoord) {
  return `${normalizeCellX(cell.x)}:${cell.y}`;
}

export function getCellLevel(cell: CellCoord) {
  return Math.max(1, cell.y + 1);
}

export function generateCellRecord(seed: string, cell: CellCoord): CellState {
  const normalizedCell = normalizeCellCoord(cell);

  if (normalizedCell.y < 0) {
    return {
      kind: 'empty',
      visited: false,
      cleared: false,
      remaining: {
        3: 0,
        2: 0,
        1: 0,
      },
    };
  }

  const random = createSeededRandom(
    `${normalizeSeed(seed)}|cell:${normalizedCell.x}:${normalizedCell.y}`,
  );
  const combat = random() < 0.5;
  return {
    kind: combat ? 'combat' : 'empty',
    visited: false,
    cleared: false,
    remaining: combat
      ? {
          3: 3,
          2: 0,
          1: 0,
        }
      : {
          3: 0,
          2: 0,
          1: 0,
        },
  };
}

export function totalAsteroids(remaining: RemainingAsteroids) {
  return remaining[3] + remaining[2] + remaining[1];
}

export type SectorAsteroidHpSummary = {
  currentHp: number;
  totalHp: number;
  hasAsteroids: boolean;
};

export function summarizeSectorAsteroidHp(
  asteroids: Asteroid[],
  level: number,
  remaining?: RemainingAsteroids,
): SectorAsteroidHpSummary {
  let currentHp = 0;

  for (const asteroid of asteroids) {
    currentHp += asteroid.hp + descendantAsteroidHp(level, asteroid.size);
  }

  const totalHp = remaining
    ? totalAsteroidTreeHp(level, remaining)
    : asteroids.reduce(
        (sum, asteroid) => sum + asteroid.maxHp + descendantAsteroidHp(level, asteroid.size),
        0,
      );

  return {
    currentHp,
    totalHp,
    hasAsteroids: asteroids.length > 0,
  };
}

function totalAsteroidTreeHp(level: number, remaining: RemainingAsteroids) {
  return (
    remaining[3] * getAsteroidTreeHp(level, 3) +
    remaining[2] * getAsteroidTreeHp(level, 2) +
    remaining[1] * getAsteroidTreeHp(level, 1)
  );
}

function getAsteroidTreeHp(level: number, size: AsteroidSize) {
  return getAsteroidHp(level, size) + descendantAsteroidHp(level, size);
}

export function prepareGameStateForSave(state: GameState) {
  saveCurrentCellProgress(state);
  handleClearCell(state);
}

function updatePassiveRegen(state: GameState, dt: number) {
  if (state.gameOver || state.player.hp >= state.player.maxHp) {
    state.regenAccumulator = 0;
    return;
  }

  state.regenAccumulator += dt * 1000;
  while (state.regenAccumulator >= PASSIVE_REGEN_INTERVAL_MS && state.player.hp < state.player.maxHp) {
    state.regenAccumulator -= PASSIVE_REGEN_INTERVAL_MS;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + PASSIVE_REGEN_AMOUNT);
  }
}

function tryShoot(state: GameState, now: number) {
  if (!state.ship.alive || now < state.nextShotAt) {
    return;
  }

  const muzzleDistance = 16;
  const random = createSeededRandom(
    `${normalizeSeed(state.seed)}|shot:${normalizeCellX(state.currentCell.x)}:${state.currentCell.y}:${state.nextShotAt}:${now}`,
  );
  const spread = (random() - 0.5) * BULLET_SPREAD;
  const angle = state.ship.angle + spread;
  const bullet: Bullet = {
    x: state.ship.x + Math.cos(angle) * muzzleDistance,
    y: state.ship.y + Math.sin(angle) * muzzleDistance,
    vx: Math.cos(angle) * BULLET_SPEED + state.ship.vx,
    vy: Math.sin(angle) * BULLET_SPEED + state.ship.vy,
    life: BULLET_LIFE,
    damage: state.player.attack,
    trailUntil: now + FLAME_THRUST_TIME * 1000,
  };

  state.bullets.push(bullet);
  state.nextShotAt = now + SHOOT_COOLDOWN * 1000;
  state.ship.vx -= Math.cos(state.ship.angle) * 18;
  state.ship.vy -= Math.sin(state.ship.angle) * 18;
  state.ship.recoilUntil = now + 70;
  spawnMuzzleParticles(state, bullet.x, bullet.y, angle, now);
  spawnFlash(state, bullet.x, bullet.y, 12, now + MUZZLE_FLASH_TIME * 1000);
  addScreenShake(state, 1.5, now + 60);
}

function updateBullets(state: GameState, dt: number) {
  const nextBullets: Bullet[] = [];

  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    if (
      bullet.life > 0 &&
      bullet.x >= 0 &&
      bullet.x <= state.width &&
      bullet.y >= 0 &&
      bullet.y <= state.height
    ) {
      nextBullets.push(bullet);
    }
  }

  state.bullets = nextBullets;
}

function updateAsteroids(state: GameState, dt: number) {
  for (const asteroid of state.asteroids) {
    asteroid.x += asteroid.vx * dt;
    asteroid.y += asteroid.vy * dt;

    if (asteroid.x < 0) asteroid.x += state.width;
    if (asteroid.x > state.width) asteroid.x -= state.width;
    if (asteroid.y < 0) asteroid.y += state.height;
    if (asteroid.y > state.height) asteroid.y -= state.height;
  }
}

function updateParticles(state: GameState, dt: number) {
  const nextParticles: Particle[] = [];

  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
    particle.vx *= 0.96;
    particle.vy *= 0.96;

    if (particle.life > 0) {
      nextParticles.push(particle);
    }
  }

  state.particles = nextParticles;
}

function resolveBulletHits(state: GameState, now: number) {
  const survivors: Bullet[] = [];
  const nextAsteroids: Asteroid[] = [];
  const spawnedAsteroids: Asteroid[] = [];

  for (const asteroid of state.asteroids) {
    nextAsteroids.push(asteroid);
  }

  for (const bullet of state.bullets) {
    let hitIndex = -1;
    for (let index = 0; index < nextAsteroids.length; index += 1) {
      const asteroid = nextAsteroids[index]!;
      if (distanceSquared(bullet.x, bullet.y, asteroid.x, asteroid.y) <= asteroid.radius ** 2) {
        hitIndex = index;
        break;
      }
    }

    if (hitIndex === -1) {
      survivors.push(bullet);
      continue;
    }

    const asteroid = nextAsteroids[hitIndex]!;
    const asteroidMass = ASTEROID_MASS[asteroid.size];
    asteroid.vx += bullet.vx / asteroidMass;
    asteroid.vy += bullet.vy / asteroidMass;
    asteroid.hp = Math.max(0, asteroid.hp - bullet.damage);
    asteroid.hpVisible = true;
    asteroid.hitFlashUntil = now + HIT_FLASH_TIME * 1000;
    asteroid.hitScaleUntil = now + HIT_SCALE_TIME * 1000;
    spawnHitParticles(state, bullet.x, bullet.y, asteroid.size === 3 ? 5 : 4, now);
    spawnFlash(state, bullet.x, bullet.y, asteroid.radius * 0.45, now + 60);
    addScreenShake(state, asteroid.size === 3 ? 2.5 : 1.5, now + 70);

    if (asteroid.hp > 0) {
      continue;
    }

    nextAsteroids.splice(hitIndex, 1);
    gainPlayerXp(state.player, asteroid.xpReward);
    spawnBurst(state, asteroid.x, asteroid.y, asteroid.size, now);
    spawnFlash(state, asteroid.x, asteroid.y, asteroid.radius, now + 100);
    addScreenShake(state, asteroid.size === 3 ? 4 : asteroid.size === 2 ? 2.5 : 1.5, now + 100);

    if (asteroid.size > 1) {
      spawnedAsteroids.push(...spawnChildAsteroids(state, asteroid));
    }
  }

  state.bullets = survivors;
  state.asteroids = nextAsteroids.concat(spawnedAsteroids);
}

function resolveShipAsteroidContacts(state: GameState, now: number) {
  for (const asteroid of state.asteroids) {
    if (distanceSquared(state.ship.x, state.ship.y, asteroid.x, asteroid.y) < (SHIP_RADIUS + asteroid.radius) ** 2) {
      resolveCircleCollision(
        state.ship,
        SHIP_RADIUS,
        SHIP_MASS,
        asteroid,
        asteroid.radius,
        ASTEROID_MASS[asteroid.size],
      );
      if (damagePlayer(state, asteroid.contactDamage, now)) {
        return;
      }
    }
  }
}

function handleCellTransitions(state: GameState, now: number) {
  let iterations = 0;
  while (iterations < 4) {
    iterations += 1;
    const delta = getCellDelta(state.ship.x, state.ship.y, state.width, state.height);
    if (!delta) {
      return;
    }

    saveCurrentCellProgress(state);
    const nextCell = {
      x: normalizeCellX(state.currentCell.x + delta.dx),
      y: state.currentCell.y + delta.dy,
    };
    if (nextCell.y < WORLD_MIN_Y) {
      nextCell.y = WORLD_MIN_Y;
    }

    state.currentCell = nextCell;
    state.ship.x = delta.nextX;
    state.ship.y = delta.nextY;
    state.ship.vx *= 0.92;
    state.ship.vy *= 0.92;
    state.ship.invulnerableUntil = now + TRANSITION_INVULNERABILITY_TIME * 1000;
    state.transitionCooldownUntil = now + 120;
    enterCell(state, state.currentCell, now, false);
    state.saveRequested = true;
  }
}

function getCellDelta(x: number, y: number, width: number, height: number) {
  let dx = 0;
  let dy = 0;
  let nextX = x;
  let nextY = y;

  if (x < 0) {
    dx = -1;
    nextX = x + width;
  } else if (x >= width) {
    dx = 1;
    nextX = x - width;
  }

  if (y < 0) {
    dy = 1;
    nextY = y + height;
  } else if (y >= height) {
    dy = -1;
    nextY = y - height;
  }

  if (dx === 0 && dy === 0) {
    return null;
  }

  return { dx, dy, nextX, nextY };
}

function damagePlayer(state: GameState, amount: number, now: number) {
  if (!state.ship.alive || now < state.ship.invulnerableUntil) {
    return false;
  }

  state.player.hp = Math.max(0, state.player.hp - amount);

  if (state.player.hp <= 0) {
    spawnBurst(state, state.ship.x, state.ship.y, 3, now);
    spawnFlash(state, state.ship.x, state.ship.y, 18, now + 100);
    addScreenShake(state, 4, now + 120);
    respawnPlayer(state, now);
    return true;
  }

  state.ship.invulnerableUntil = now + DAMAGE_INVULNERABILITY_TIME * 1000;
  state.ship.recoilUntil = now + 100;
  spawnHitParticles(state, state.ship.x, state.ship.y, 7, now);
  spawnFlash(state, state.ship.x, state.ship.y, 18, now + 80);
  addScreenShake(state, 3, now + 120);
  return false;
}

function handleClearCell(state: GameState) {
  const cell = state.cells[cellKey(state.currentCell)];
  if (!cell || cell.kind !== 'combat' || cell.cleared || state.asteroids.length > 0) {
    return;
  }

  cell.cleared = true;
  state.lastClearedCell = { ...state.currentCell };
  cell.remaining = {
    3: 0,
    2: 0,
    1: 0,
  };
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + CELL_CLEAR_HEAL);
  gainPlayerXp(state.player, CELL_CLEAR_XP);
  state.regenAccumulator = 0;
  state.saveRequested = true;
}

function respawnPlayer(state: GameState, now: number) {
  saveCurrentCellProgress(state);

  const respawnCell = { ...state.lastClearedCell };
  state.currentCell = respawnCell;
  state.ship.x = Math.floor(state.width / 2);
  state.ship.y = Math.floor(state.height / 2);
  state.ship.vx = 0;
  state.ship.vy = 0;
  state.ship.alive = true;
  state.ship.recoilUntil = 0;
  state.ship.invulnerableUntil = now + RESPAWN_BLINK_TIME * 1000;
  state.respawnBlinkUntil = state.ship.invulnerableUntil;
  state.player.hp = state.player.maxHp;
  state.bullets = [];
  state.asteroids = [];
  enterCell(state, state.currentCell, now, false);
  state.saveRequested = true;
}

function saveCurrentCellProgress(state: GameState) {
  const cell = ensureCellExists(state, state.currentCell);

  if (cell.kind === 'empty') {
    cell.visited = true;
    return;
  }

  cell.visited = true;
  if (state.asteroids.length === 0) {
    cell.remaining = {
      3: 0,
      2: 0,
      1: 0,
    };
    cell.cleared = true;
    return;
  }

  cell.remaining = {
    3: 3,
    2: 0,
    1: 0,
  };
  cell.cleared = false;
}

function enterCell(state: GameState, cell: CellCoord, now: number, initial: boolean) {
  const record = ensureCellExists(state, cell);
  record.visited = true;

  if (record.kind === 'empty') {
    state.asteroids = [];
    state.saveRequested = !initial;
    return;
  }

  const remaining = totalAsteroids(record.remaining);
  if (record.cleared || remaining === 0) {
    record.cleared = true;
    record.remaining = { 3: 0, 2: 0, 1: 0 };
    state.asteroids = [];
    state.saveRequested = !initial;
    return;
  }

  state.asteroids = spawnAsteroidsForCell({
    cell,
    level: getCellLevel(cell),
    seed: state.seed,
    spawnCounter: state.spawnCounter,
    width: state.width,
    height: state.height,
  }, record.remaining);
  state.spawnCounter += 1;
  state.saveRequested = !initial;
}

function ensureCellLoaded(state: GameState, cell: CellCoord, initial: boolean) {
  const record = ensureCellExists(state, cell);
  record.visited = true;

  if (record.kind === 'empty' || record.cleared || totalAsteroids(record.remaining) === 0) {
    state.asteroids = [];
    return;
  }

  state.asteroids = spawnAsteroidsForCell({
    cell,
    level: getCellLevel(cell),
    seed: state.seed,
    spawnCounter: state.spawnCounter,
    width: state.width,
    height: state.height,
  }, record.remaining);
  state.spawnCounter += 1;
  if (!initial) {
    state.saveRequested = true;
  }
}

function ensureCellExists(state: GameState, cell: CellCoord) {
  const key = cellKey(cell);
  let record = state.cells[key];
  if (record) {
    return record;
  }

  record = generateCellRecord(state.seed, cell);
  record.visited = true;
  state.cells[key] = record;
  return record;
}

function spawnAsteroidsForCell(context: CellSpawnContext, remaining: RemainingAsteroids) {
  const asteroids: Asteroid[] = [];
  const random = createSeededRandom(
    `${normalizeSeed(context.seed)}|spawn:${normalizeCellX(context.cell.x)}:${context.cell.y}:${context.spawnCounter}:${context.level}`,
  );

  const spawnCount = (size: AsteroidSize, count: number) => {
    for (let index = 0; index < count; index += 1) {
      const asteroid = createAsteroid(
        context.level,
        size,
        random,
        context.width,
        context.height,
      );
      asteroids.push(asteroid);
    }
  };

  spawnCount(3, remaining[3]);
  spawnCount(2, remaining[2]);
  spawnCount(1, remaining[1]);
  return asteroids;
}

function createAsteroid(
  level: number,
  size: AsteroidSize,
  random: () => number,
  width: number,
  height: number,
): Asteroid {
  const angle = random() * Math.PI * 2;
  const sizeBias = size === 3 ? 1 : size === 2 ? 1.15 : 1.3;
  const levelBias = 1 + Math.min(level, 12) * 0.04;
  const speed = ASTEROID_SPEED[size] * sizeBias * levelBias;
  const hp = getAsteroidHp(level, size);

  return {
    x: width / 2,
    y: height / 2,
    vx: Math.cos(angle + Math.PI / 2) * speed,
    vy: Math.sin(angle + Math.PI / 2) * speed,
    size,
    radius: ASTEROID_RADIUS[size],
    hp,
    maxHp: hp,
    xpReward: ASTEROID_XP_REWARD[size],
    contactDamage: getAsteroidContactDamage(level, size),
    hpVisible: false,
    hitFlashUntil: 0,
    hitScaleUntil: 0,
  };
}

function spawnChildAsteroids(state: GameState, asteroid: Asteroid) {
  const childSize = (asteroid.size - 1) as AsteroidSize;
  const random = createSeededRandom(
    `${normalizeSeed(state.seed)}|child:${normalizeCellX(state.currentCell.x)}:${state.currentCell.y}:${state.spawnCounter}:${asteroid.size}:${asteroid.hp}`,
  );
  state.spawnCounter += 1;
  const children: Asteroid[] = [];

  for (let index = 0; index < 3; index += 1) {
    const angle = random() * Math.PI * 2;
    const speed = ASTEROID_SPEED[childSize] * (0.85 + random() * 0.3);
    const childHp = getAsteroidHp(getCellLevel(state.currentCell), childSize);
    const offset = asteroid.radius * 0.18;
    children.push({
      x: asteroid.x + Math.cos(angle) * offset,
      y: asteroid.y + Math.sin(angle) * offset,
      vx: Math.cos(angle) * speed + asteroid.vx * 0.25,
      vy: Math.sin(angle) * speed + asteroid.vy * 0.25,
      size: childSize,
      radius: ASTEROID_RADIUS[childSize],
      hp: childHp,
      maxHp: childHp,
      xpReward: ASTEROID_XP_REWARD[childSize],
      contactDamage: getAsteroidContactDamage(getCellLevel(state.currentCell), childSize),
      hpVisible: false,
      hitFlashUntil: 0,
      hitScaleUntil: 0,
    });
  }

  return children;
}

export function normalizeCellX(x: number) {
  return ((x % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH;
}

export function normalizeCellCoord(cell: CellCoord) {
  return {
    x: normalizeCellX(cell.x),
    y: cell.y,
  };
}

function getAsteroidHp(level: number, size: AsteroidSize) {
  const largeHp = 12 + 4 * (level - 1);
  if (size === 3) {
    return largeHp;
  }
  if (size === 2) {
    return Math.max(1, Math.floor(largeHp / 2));
  }
  return Math.max(1, Math.floor(largeHp / 4));
}

function descendantAsteroidHp(level: number, size: AsteroidSize): number {
  if (size === 1) {
    return 0;
  }

  if (size === 2) {
    return 3 * getAsteroidHp(level, 1);
  }

  return 3 * (getAsteroidHp(level, 2) + descendantAsteroidHp(level, 2));
}

function getAsteroidContactDamage(level: number, size: AsteroidSize) {
  const attack = level;
  return attack * size;
}

function cloneCellStateMap(cells: Record<string, CellState>) {
  const next: Record<string, CellState> = {};
  for (const [key, cell] of Object.entries(cells)) {
    next[key] = {
      kind: cell.kind,
      visited: cell.visited,
      cleared: cell.cleared,
      remaining: { ...cell.remaining },
    };
  }
  return next;
}

function cloneBullets(bullets: Bullet[]) {
  return bullets.map((bullet) => ({
    trailUntil: 0,
    ...bullet,
  }));
}

function cloneAsteroids(asteroids: Asteroid[]) {
  return asteroids.map((asteroid) => ({
    hitFlashUntil: 0,
    hitScaleUntil: 0,
    ...asteroid,
  }));
}

function spawnParticle(state: GameState, particle: Particle) {
  state.particles.push(particle);
}

function createEventRandom(state: GameState, label: string, now: number, x: number, y: number) {
  return createSeededRandom(
    `${normalizeSeed(state.seed)}|fx:${label}:${normalizeCellX(state.currentCell.x)}:${state.currentCell.y}:${state.spawnCounter}:${Math.round(now)}:${Math.round(x)}:${Math.round(y)}`,
  );
}

function spawnMuzzleParticles(state: GameState, x: number, y: number, angle: number, now: number) {
  const random = createEventRandom(state, 'muzzle', now, x, y);

  for (let index = 0; index < 3; index += 1) {
    const speed = 55 + index * 22;
    const spread = (random() - 0.5) * 26;
    const life = 0.08 + index * 0.01;
    spawnParticle(state, {
      x,
      y,
      vx: Math.cos(angle) * speed + spread,
      vy: Math.sin(angle) * speed + spread * 0.35,
      life,
      maxLife: life,
      size: 2 + index * 0.4,
      kind: 'muzzle',
    });
  }
}

function spawnHitParticles(state: GameState, x: number, y: number, count: number, now: number) {
  const random = createEventRandom(state, 'hit', now, x, y);

  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const speed = 60 + random() * 160;
    const life = 0.22 + random() * 0.12;
    spawnParticle(state, {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: 0.34,
      size: 2 + random() * 2,
      kind: index % 2 === 0 ? 'spark' : 'debris',
    });
  }
}

function spawnBurst(state: GameState, x: number, y: number, size: AsteroidSize, now: number) {
  const count = size === 3 ? 12 : size === 2 ? 8 : 5;
  const random = createEventRandom(state, 'burst', now, x, y);

  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const speed = 50 + random() * 110;
    const life = 0.16 + random() * 0.16;
    spawnParticle(state, {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: 0.32,
      size: 2 + random() * 2,
      kind: index % 3 === 0 ? 'burst' : 'debris',
    });
  }
}

function spawnFlash(state: GameState, x: number, y: number, radius: number, until: number) {
  state.flashes.push({
    x,
    y,
    radius,
    until,
  });
}

function addScreenShake(state: GameState, amplitude: number, until: number) {
  state.shake.amplitude = Math.max(state.shake.amplitude, amplitude);
  state.shake.until = Math.max(state.shake.until, until);
}

function updateTransientFeedback(state: GameState, now: number) {
  state.flashes = state.flashes.filter((flash) => now < flash.until);
  if (now >= state.shake.until) {
    state.shake.amplitude = 0;
    state.shake.until = 0;
  }
}

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function resolveCircleCollision(
  ship: { x: number; y: number; vx: number; vy: number },
  shipRadius: number,
  shipMass: number,
  asteroid: { x: number; y: number; vx: number; vy: number },
  asteroidRadius: number,
  asteroidMass: number,
) {
  const dx = asteroid.x - ship.x;
  const dy = asteroid.y - ship.y;
  const minDistance = shipRadius + asteroidRadius;
  const distance = Math.hypot(dx, dy);

  let normalX = 1;
  let normalY = 0;
  if (distance > 0) {
    normalX = dx / distance;
    normalY = dy / distance;
  } else {
    const relVx = ship.vx - asteroid.vx;
    const relVy = ship.vy - asteroid.vy;
    const relSpeed = Math.hypot(relVx, relVy);
    if (relSpeed > 0) {
      normalX = relVx / relSpeed;
      normalY = relVy / relSpeed;
    }
  }

  const penetration = minDistance - distance;
  const inverseShipMass = 1 / shipMass;
  const inverseAsteroidMass = 1 / asteroidMass;
  const inverseMassSum = inverseShipMass + inverseAsteroidMass;
  const correction = penetration / inverseMassSum;

  ship.x -= normalX * correction * inverseShipMass;
  ship.y -= normalY * correction * inverseShipMass;
  asteroid.x += normalX * correction * inverseAsteroidMass;
  asteroid.y += normalY * correction * inverseAsteroidMass;

  const relativeVx = asteroid.vx - ship.vx;
  const relativeVy = asteroid.vy - ship.vy;
  const velocityAlongNormal = relativeVx * normalX + relativeVy * normalY;

  if (velocityAlongNormal >= 0) {
    return;
  }

  const impulse = (-2 * velocityAlongNormal) / inverseMassSum;
  const impulseX = impulse * normalX;
  const impulseY = impulse * normalY;

  ship.vx -= impulseX * inverseShipMass;
  ship.vy -= impulseY * inverseShipMass;
  asteroid.vx += impulseX * inverseAsteroidMass;
  asteroid.vy += impulseY * inverseAsteroidMass;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
