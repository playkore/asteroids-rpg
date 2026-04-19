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
};

export type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
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
};

export type GameState = {
  seed: string;
  slotIndex: SaveSlotIndex | null;
  currentCell: CellCoord;
  cells: Record<string, CellState>;
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  player: PlayerStats;
  gameOver: boolean;
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
const BULLET_LIFE = 1.05;
const SHOOT_COOLDOWN = 0.18;
const DAMAGE_INVULNERABILITY_TIME = 1.4;
const TRANSITION_INVULNERABILITY_TIME = 0.25;
const CELL_CLEAR_XP = 3;
const CELL_CLEAR_HEAL = 2;
const PASSIVE_REGEN_INTERVAL_MS = 10000;
const PASSIVE_REGEN_AMOUNT = 1;
const WORLD_WIDTH = 7;
const WORLD_MIN_Y = -4;

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
    cells: cloneCellStateMap(options.cells ?? {}),
    ship: {
      x: Math.floor(width / 2),
      y: Math.floor(height / 2),
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      invulnerableUntil: 0,
      alive: true,
      ...options.ship,
    },
    bullets: cloneBullets(options.bullets ?? []),
    asteroids: cloneAsteroids(options.asteroids ?? []),
    player: options.player ? { ...options.player } : createPlayerStats(),
    gameOver: options.gameOver ?? false,
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

export function hydrateGameState(snapshot: SaveSlotData): GameState {
  return createGameState(snapshot.width, snapshot.height, snapshot.seed, {
    slotIndex: null,
    currentCell: snapshot.currentCell,
    player: snapshot.player,
    cells: snapshot.cells,
    ship: snapshot.ship,
    gameOver: snapshot.gameOver,
    nextShotAt: snapshot.nextShotAt,
    transitionCooldownUntil: snapshot.transitionCooldownUntil,
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
  resolveBulletHits(state);
  handleClearCell(state);
  updatePassiveRegen(state, dt);

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
  const sectorHp = summarizeSectorAsteroidHp(state.asteroids, getCellLevel(state.currentCell));
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
  const combat = random() < 0.25;
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

export function countAsteroidsBySize(asteroids: Asteroid[]): RemainingAsteroids {
  return {
    3: asteroids.filter((asteroid) => asteroid.size === 3).length,
    2: asteroids.filter((asteroid) => asteroid.size === 2).length,
    1: asteroids.filter((asteroid) => asteroid.size === 1).length,
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

export function summarizeSectorAsteroidHp(asteroids: Asteroid[], level: number): SectorAsteroidHpSummary {
  let currentHp = 0;
  let totalHp = 0;

  for (const asteroid of asteroids) {
    currentHp += asteroid.hp + descendantAsteroidHp(level, asteroid.size);
    totalHp += asteroid.maxHp + descendantAsteroidHp(level, asteroid.size);
  }

  return {
    currentHp,
    totalHp,
    hasAsteroids: asteroids.length > 0,
  };
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
  const bullet: Bullet = {
    x: state.ship.x + Math.cos(state.ship.angle) * muzzleDistance,
    y: state.ship.y + Math.sin(state.ship.angle) * muzzleDistance,
    vx: Math.cos(state.ship.angle) * BULLET_SPEED + state.ship.vx,
    vy: Math.sin(state.ship.angle) * BULLET_SPEED + state.ship.vy,
    life: BULLET_LIFE,
    damage: state.player.attack,
  };

  state.bullets.push(bullet);
  state.nextShotAt = now + SHOOT_COOLDOWN * 1000;
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

function resolveBulletHits(state: GameState) {
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
    asteroid.hp = Math.max(0, asteroid.hp - bullet.damage);
    asteroid.hpVisible = true;

    if (asteroid.hp > 0) {
      continue;
    }

    nextAsteroids.splice(hitIndex, 1);
    gainPlayerXp(state.player, asteroid.xpReward);

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
      damagePlayer(state, asteroid.contactDamage, now);
      return;
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
    return;
  }

  state.player.hp = Math.max(0, state.player.hp - amount);
  state.ship.invulnerableUntil = now + DAMAGE_INVULNERABILITY_TIME * 1000;

  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.ship.alive = false;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.gameOver = true;
    state.saveRequested = true;
  }
}

function handleClearCell(state: GameState) {
  const cell = state.cells[cellKey(state.currentCell)];
  if (!cell || cell.kind !== 'combat' || cell.cleared || state.asteroids.length > 0) {
    return;
  }

  cell.cleared = true;
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

function saveCurrentCellProgress(state: GameState) {
  const key = cellKey(state.currentCell);
  const cell = ensureCellExists(state, state.currentCell);

  if (cell.kind === 'empty') {
    cell.visited = true;
    return;
  }

  cell.visited = true;
  cell.remaining = countAsteroidsBySize(state.asteroids);
  cell.cleared = totalAsteroids(cell.remaining) === 0;
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
        context.spawnCounter + index,
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
  salt: number,
  width: number,
  height: number,
): Asteroid {
  const angle = random() * Math.PI * 2;
  const distance = 80 + random() * 220;
  const sizeBias = size === 3 ? 1 : size === 2 ? 1.15 : 1.3;
  const levelBias = 1 + Math.min(level, 12) * 0.04;
  const speed = ASTEROID_SPEED[size] * sizeBias * levelBias;
  const hp = getAsteroidHp(level, size);

  return {
    x: clamp(Math.cos(angle) * distance + width / 2 + (salt % 3 - 1) * 24, 20, width - 20),
    y: clamp(Math.sin(angle) * distance + height / 2 + ((salt + 1) % 3 - 1) * 24, 20, height - 20),
    vx: Math.cos(angle + Math.PI / 2) * speed,
    vy: Math.sin(angle + Math.PI / 2) * speed,
    size,
    radius: ASTEROID_RADIUS[size],
    hp,
    maxHp: hp,
    xpReward: ASTEROID_XP_REWARD[size],
    contactDamage: getAsteroidContactDamage(level, size),
    hpVisible: false,
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
    children.push({
      x: asteroid.x,
      y: asteroid.y,
      vx: Math.cos(angle) * speed + asteroid.vx * 0.25,
      vy: Math.sin(angle) * speed + asteroid.vy * 0.25,
      size: childSize,
      radius: ASTEROID_RADIUS[childSize],
      hp: childHp,
      maxHp: childHp,
      xpReward: ASTEROID_XP_REWARD[childSize],
      contactDamage: getAsteroidContactDamage(getCellLevel(state.currentCell), childSize),
      hpVisible: false,
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
  return bullets.map((bullet) => ({ ...bullet }));
}

function cloneAsteroids(asteroids: Asteroid[]) {
  return asteroids.map((asteroid) => ({ ...asteroid }));
}

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
