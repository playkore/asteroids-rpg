import type { Asteroid, Bullet, GameState, Ship } from './game';
import { UI_LINE_COLOR, UI_LINE_WIDTH } from './constants';

type AsteroidPoint = {
  angle: number;
  distance: number;
};

const ASTEROID_SHAPE_CACHE: Partial<Record<number, AsteroidPoint[]>> = {};
const GRID_LINE_WIDTH = 1;
const GRID_SPACING = 120;
const GRID_COLOR = '#232a33';

export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  dpr: number,
  flameVisible: boolean,
) {
  const { width, height } = state;
  const cameraX = state.ship.x - width / 2;
  const cameraY = state.ship.y - height / 2;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  beginCavePath(ctx, state.cave);
  ctx.clip();
  drawBackgroundGrid(ctx, cameraX, cameraY, width, height);
  ctx.restore();

  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  drawCave(ctx, state.cave);
  drawPortals(ctx, state.portals);
  drawAsteroids(ctx, state.asteroids);
  drawBullets(ctx, state.bullets);
  drawShip(ctx, state.ship, flameVisible);
  ctx.restore();
}

export function drawMiniMap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  dpr: number,
  width: number,
  height: number,
) {
  const worldSpan = Math.max(state.width, state.height) * 2;
  const padding = 12;
  const scale = Math.min((width - padding * 2) / worldSpan, (height - padding * 2) / worldSpan);
  const centerX = width / 2;
  const centerY = height / 2;
  const toMiniX = (value: number) => centerX + (value - state.ship.x) * scale;
  const toMiniY = (value: number) => centerY + (value - state.ship.y) * scale;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = UI_LINE_WIDTH;
  ctx.strokeRect(0, 0, width, height);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  drawMiniMapCave(ctx, state.cave, toMiniX, toMiniY);
  drawMiniMapAsteroids(ctx, state.asteroids, toMiniX, toMiniY);
  drawMiniMapShip(ctx, centerX, centerY);

  ctx.restore();
}

function drawCave(ctx: CanvasRenderingContext2D, cave: { x: number; y: number }[]) {
  beginCavePath(ctx, cave);

  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = UI_LINE_WIDTH;
  ctx.stroke();
}

function beginCavePath(ctx: CanvasRenderingContext2D, cave: { x: number; y: number }[]) {
  if (cave.length === 0) {
    return;
  }

  const first = cave[0]!;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < cave.length; i += 1) {
    const point = cave[i]!;
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
}

function drawBackgroundGrid(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  width: number,
  height: number,
) {
  const left = cameraX - GRID_SPACING;
  const top = cameraY - GRID_SPACING;
  const right = cameraX + width + GRID_SPACING;
  const bottom = cameraY + height + GRID_SPACING;
  const startX = Math.floor(left / GRID_SPACING) * GRID_SPACING;
  const startY = Math.floor(top / GRID_SPACING) * GRID_SPACING;

  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = GRID_LINE_WIDTH;
  ctx.beginPath();

  for (let x = startX; x <= right; x += GRID_SPACING) {
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
  }

  for (let y = startY; y <= bottom; y += GRID_SPACING) {
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
  }

  ctx.stroke();
}

function drawAsteroids(ctx: CanvasRenderingContext2D, asteroids: Asteroid[]) {
  for (const asteroid of asteroids) {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.fillStyle = '#05070c';
    beginAsteroidPath(ctx, asteroid);
    ctx.fill();
    ctx.strokeStyle = UI_LINE_COLOR;
    ctx.lineWidth = UI_LINE_WIDTH;
    ctx.stroke();
    ctx.restore();
  }
}

function drawPortals(ctx: CanvasRenderingContext2D, portals: { x: number; y: number }[]) {
  if (portals.length === 0) {
    return;
  }

  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = UI_LINE_WIDTH;
  for (const deadEnd of portals) {
    ctx.beginPath();
    ctx.arc(deadEnd.x, deadEnd.y, 10, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]) {
  ctx.fillStyle = UI_LINE_COLOR;
  for (const bullet of bullets) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShip(ctx: CanvasRenderingContext2D, ship: Ship, flameVisible: boolean) {
  if (!ship.alive) {
    return;
  }

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
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
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  if (flameVisible) {
    ctx.lineTo(-17, 0);
  }
  ctx.stroke();
  ctx.restore();
}

function drawMiniMapCave(
  ctx: CanvasRenderingContext2D,
  cave: { x: number; y: number }[],
  toMiniX: (value: number) => number,
  toMiniY: (value: number) => number,
) {
  if (cave.length === 0) {
    return;
  }

  const first = cave[0]!;
  ctx.beginPath();
  ctx.moveTo(toMiniX(first.x), toMiniY(first.y));
  for (let i = 1; i < cave.length; i += 1) {
    const point = cave[i]!;
    ctx.lineTo(toMiniX(point.x), toMiniY(point.y));
  }
  ctx.closePath();
  ctx.stroke();
}

function drawMiniMapAsteroids(
  ctx: CanvasRenderingContext2D,
  asteroids: Asteroid[],
  toMiniX: (value: number) => number,
  toMiniY: (value: number) => number,
) {
  for (const asteroid of asteroids) {
    ctx.beginPath();
    ctx.arc(toMiniX(asteroid.x), toMiniY(asteroid.y), 2.5, 0, Math.PI * 2);
    ctx.stroke();
  }
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

function drawMiniMapShip(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
  ctx.fillStyle = UI_LINE_COLOR;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

export function asteroidShape(radius: number) {
  const cached = ASTEROID_SHAPE_CACHE[radius];
  if (cached) {
    return cached;
  }

  const segments = 9;
  const points = Array.from({ length: segments }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2;
    const distance = 0.78 + 0.27 * Math.sin(radius * 0.11 + index * 2.1);
    return { angle, distance };
  });
  ASTEROID_SHAPE_CACHE[radius] = points;
  return points;
}
