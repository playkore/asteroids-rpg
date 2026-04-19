import type { Asteroid, Bullet, FlashEffect, GameState, Particle, Ship } from './game';
import { normalizeCellX } from './game';
import { UI_LINE_COLOR, UI_LINE_WIDTH } from './constants';

type AsteroidPoint = {
  angle: number;
  distance: number;
};

const ASTEROID_SHAPE_CACHE: Partial<Record<number, AsteroidPoint[]>> = {};
const GRID_LINE_WIDTH = 1;
const GRID_SPACING = 84;
const GRID_COLOR = '#232a33';

export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  dpr: number,
  flameVisible: boolean,
) {
  const { width, height } = state;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, width, height);

  const shakeOffset = getShakeOffset(state, now);
  ctx.save();
  if (shakeOffset.x !== 0 || shakeOffset.y !== 0) {
    ctx.translate(shakeOffset.x, shakeOffset.y);
  }

  drawBackgroundGrid(ctx, width, height);
  drawArenaFrame(ctx, width, height);
  drawParticles(ctx, state.particles);
  drawAsteroids(ctx, state.asteroids, now);
  drawBullets(ctx, state.bullets, now);
  drawFlashes(ctx, state.flashes, now);
  drawShip(ctx, state.ship, now, state.respawnBlinkUntil, flameVisible);
  ctx.restore();
}

export function drawMiniMap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  dpr: number,
  width: number,
  height: number,
) {
  const layout = buildMiniMapLayout(state, width, height);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = UI_LINE_WIDTH;
  ctx.strokeRect(0, 0, width, height);

  for (const cell of layout.cells) {
    if (!cell.visited) {
      continue;
    }

    if (cell.current) {
      const inset = Math.max(1, Math.floor(layout.cellSize * 0.06));
      ctx.strokeStyle = '#f5f9ff';
      ctx.lineWidth = UI_LINE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(cell.x + inset, cell.y + inset);
      ctx.lineTo(cell.x + layout.cellSize - inset, cell.y + layout.cellSize - inset);
      ctx.moveTo(cell.x + inset, cell.y + layout.cellSize - inset);
      ctx.lineTo(cell.x + layout.cellSize - inset, cell.y + inset);
      ctx.stroke();
      continue;
    }

    if (cell.remaining > 0) {
      ctx.fillStyle = '#f5f9ff';
      ctx.fillRect(cell.x, cell.y, layout.cellSize, layout.cellSize);
    }

    ctx.strokeStyle = '#f5f9ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cell.x, cell.y, layout.cellSize, layout.cellSize);
  }
}

function drawArenaFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = UI_LINE_WIDTH;
  ctx.strokeRect(0, 0, width, height);
}

function drawBackgroundGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = GRID_LINE_WIDTH;
  ctx.beginPath();

  for (let x = 0; x <= width; x += GRID_SPACING) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }

  for (let y = 0; y <= height; y += GRID_SPACING) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }

  ctx.stroke();
}

function drawAsteroids(ctx: CanvasRenderingContext2D, asteroids: Asteroid[], now: number) {
  for (const asteroid of asteroids) {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    const hitFlashUntil = asteroid.hitFlashUntil ?? 0;
    const hitScaleUntil = asteroid.hitScaleUntil ?? 0;
    const hitFlash = now < hitFlashUntil;
    const hitScale = now < hitScaleUntil ? 1.05 : 1;
    if (hitScale !== 1) {
      ctx.scale(hitScale, hitScale);
    }
    ctx.fillStyle = '#05070c';
    beginAsteroidPath(ctx, asteroid);
    ctx.fill();
    ctx.strokeStyle = UI_LINE_COLOR;
    ctx.lineWidth = hitFlash ? UI_LINE_WIDTH + 1 : UI_LINE_WIDTH;
    ctx.stroke();

    if (asteroid.hpVisible) {
      drawAsteroidHp(ctx, asteroid);
    }

    ctx.restore();
  }
}

function drawAsteroidHp(ctx: CanvasRenderingContext2D, asteroid: Asteroid) {
  const width = asteroid.radius * 1.2;
  const height = 6;
  const x = -width / 2;
  const y = -asteroid.radius - 14;
  const fill = Math.max(0, Math.min(1, asteroid.hp / asteroid.maxHp));

  ctx.fillStyle = '#05070c';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = UI_LINE_COLOR;
  ctx.fillRect(x + 1, y + 1, Math.max(0, (width - 2) * fill), height - 2);
}

function drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[], now: number) {
  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = UI_LINE_WIDTH;
  ctx.lineCap = 'round';
  for (const bullet of bullets) {
    ctx.beginPath();
    const trailScale = now < (bullet.trailUntil ?? 0) ? 0.035 : 0.02;
    ctx.moveTo(bullet.x, bullet.y);
    ctx.lineTo(bullet.x - bullet.vx * trailScale, bullet.y - bullet.vy * trailScale);
    ctx.stroke();
  }
}

const RESPAWN_BLINK_PERIOD_MS = 180;

function drawShip(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  now: number,
  respawnBlinkUntil: number,
  flameVisible: boolean,
) {
  if (!ship.alive) {
    return;
  }

  if (now < respawnBlinkUntil && Math.floor(now / RESPAWN_BLINK_PERIOD_MS) % 2 === 1) {
    return;
  }

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  if (now < (ship.recoilUntil ?? 0)) {
    ctx.scale(0.98, 1.02);
  }
  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = UI_LINE_WIDTH;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-12, -10);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-12, 10);
  ctx.closePath();
  ctx.stroke();
  if (flameVisible) {
    ctx.beginPath();
    ctx.moveTo(-12, -3);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-12, 3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  for (const particle of particles) {
    const size = Math.max(1.2, particle.size * Math.max(0.35, particle.life / particle.maxLife));
    const trail = particle.kind === 'muzzle' ? 0.04 : particle.kind === 'burst' ? 0.03 : 0.025;
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(
      particle.x - particle.vx * trail * size,
      particle.y - particle.vy * trail * size,
    );
    ctx.stroke();
  }
}

function drawFlashes(ctx: CanvasRenderingContext2D, flashes: FlashEffect[], now: number) {
  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = UI_LINE_WIDTH;
  ctx.lineCap = 'round';

  for (const flash of flashes) {
    if (now >= flash.until) {
      continue;
    }

    ctx.save();
    ctx.translate(flash.x, flash.y);
    ctx.fillStyle = UI_LINE_COLOR;
    ctx.beginPath();
    ctx.arc(0, 0, flash.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-flash.radius, 0);
    ctx.lineTo(flash.radius, 0);
    ctx.moveTo(0, -flash.radius);
    ctx.lineTo(0, flash.radius);
    ctx.stroke();
    ctx.restore();
  }
}

function getShakeOffset(state: GameState, now: number) {
  if (now >= state.shake.until || state.shake.amplitude <= 0) {
    return { x: 0, y: 0 };
  }

  const remaining = Math.max(0, state.shake.until - now);
  const falloff = Math.min(1, remaining / 90);
  const amplitude = state.shake.amplitude * falloff;
  const t = now * 0.05;

  return {
    x: Math.sin(t) * amplitude,
    y: Math.cos(t * 1.3) * amplitude,
  };
}

function beginAsteroidPath(ctx: CanvasRenderingContext2D, asteroid: Asteroid) {
  const points = asteroidShape(asteroid.radius);
  ctx.beginPath();
  points.forEach((point, index) => {
    const px = Math.cos(point.angle) * asteroid.radius * point.distance;
    const py = Math.sin(point.angle) * asteroid.radius * point.distance;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
}

export function asteroidShape(radius: number) {
  const cached = ASTEROID_SHAPE_CACHE[radius];
  if (cached) {
    return cached;
  }

  const segments = 9;
  const points: AsteroidPoint[] = [];
  for (let index = 0; index < segments; index += 1) {
    points.push({
      angle: (index / segments) * Math.PI * 2,
      distance: 0.78 + ((radius * 13 + index * 17) % 11) / 30,
    });
  }
  ASTEROID_SHAPE_CACHE[radius] = points;
  return points;
}

type MiniMapCell = {
  key: string;
  x: number;
  y: number;
  visited: boolean;
  remaining: number;
  current: boolean;
};

export function buildMiniMapLayout(state: GameState, width: number, height: number) {
  const size = 7;
  const half = Math.floor(size / 2);
  const gap = 4;
  const cellSize = Math.max(8, Math.floor(Math.min((width - 20) / size, (height - 20) / size) - gap));
  const pitch = cellSize + gap;
  const cells: MiniMapCell[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const x = normalizeCellX(state.currentCell.x + col - half);
      const y = state.currentCell.y + half - row;
      const key = `${x}:${y}`;
      const cell = state.cells[key];
      const remaining = cell ? cell.remaining[3] + cell.remaining[2] + cell.remaining[1] : 0;
      cells.push({
        key,
        x: 10 + col * pitch,
        y: 10 + row * pitch,
        visited: cell?.visited ?? false,
        remaining,
        current: state.currentCell.x === x && state.currentCell.y === y,
      });
    }
  }

  return { cells, cellSize };
}
