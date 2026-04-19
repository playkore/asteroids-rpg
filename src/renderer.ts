import type { Asteroid, Bullet, GameState, Ship } from './game';
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

  drawBackgroundGrid(ctx, width, height);
  drawArenaFrame(ctx, width, height);
  drawAsteroids(ctx, state.asteroids);
  drawBullets(ctx, state.bullets);
  drawShip(ctx, state.ship, flameVisible);
}

export function drawMiniMap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  dpr: number,
  width: number,
  height: number,
) {
  const layout = buildMiniMapLayout(state, width, height);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = UI_LINE_WIDTH;
  ctx.strokeRect(0, 0, width, height);

  for (const cell of layout.cells) {
    const fill = cell.visited ? '#f5f9ff' : '#05070c';
    ctx.fillStyle = fill;
    ctx.fillRect(cell.x, cell.y, layout.cellSize, layout.cellSize);
    ctx.strokeStyle = cell.current ? '#f5f9ff' : '#8f99a6';
    ctx.lineWidth = cell.current ? UI_LINE_WIDTH : 1.5;
    ctx.strokeRect(cell.x, cell.y, layout.cellSize, layout.cellSize);

    if (cell.visited && cell.remaining > 0) {
      ctx.fillStyle = '#05070c';
      ctx.beginPath();
      ctx.arc(cell.x + layout.cellSize / 2, cell.y + layout.cellSize / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
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
  const cellKeys = Object.keys(state.cells);
  const xs = cellKeys.map((key) => Number(key.split(':')[0]));
  const ys = cellKeys.map((key) => Number(key.split(':')[1]));
  xs.push(state.currentCell.x);
  ys.push(state.currentCell.y);

  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minY = Math.max(0, Math.min(...ys) - 1);
  const maxY = Math.max(...ys) + 1;

  const cols = maxX - minX + 1;
  const rows = maxY - minY + 1;
  const gap = 4;
  const cellSize = Math.max(8, Math.floor(Math.min((width - 20) / cols, (height - 20) / rows) - gap));
  const pitch = cellSize + gap;
  const cells: MiniMapCell[] = [];

  for (let y = maxY; y >= minY; y -= 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const key = `${x}:${y}`;
      const cell = state.cells[key];
      const remaining = cell ? cell.remaining[3] + cell.remaining[2] + cell.remaining[1] : 0;
      cells.push({
        key,
        x: 10 + (x - minX) * pitch,
        y: 10 + (maxY - y) * pitch,
        visited: cell?.visited ?? false,
        remaining,
        current: state.currentCell.x === x && state.currentCell.y === y,
      });
    }
  }

  return { cells, cellSize };
}
