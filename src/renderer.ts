import type { Asteroid, Bullet, GameState, Ship } from './game';
import { UI_LINE_COLOR, UI_LINE_WIDTH } from './constants';

type AsteroidPoint = {
  angle: number;
  distance: number;
};

type Star = {
  x: number;
  y: number;
  size: number;
  bright: boolean;
  pulseOffset: number;
};

const ASTEROID_SHAPE_CACHE: Partial<Record<number, AsteroidPoint[]>> = {};
const STARFIELD_SPAN = 6000;
const STARFIELD = createStarfield();
const BRIGHT_STARS = '#f4fbff';
const DIM_STARS = '#7f8b98';

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

  drawStarfield(ctx, width, height, now, cameraX, cameraY);

  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  drawCave(ctx, state.cave);
  drawAsteroids(ctx, state.asteroids);
  drawBullets(ctx, state.bullets);
  drawShip(ctx, state.ship, flameVisible);
  ctx.restore();
}

export function getStarfield() {
  return STARFIELD;
}

function drawStarfield(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  now: number,
  cameraX: number,
  cameraY: number,
) {
  const twinkleFrame = Math.floor(now / 180);
  for (const star of STARFIELD) {
    ctx.fillStyle =
      ((twinkleFrame + star.pulseOffset) & 3) === 0
        ? BRIGHT_STARS
        : star.bright
          ? BRIGHT_STARS
          : DIM_STARS;
    const x = mod(star.x - cameraX * 0.1, width);
    const y = mod(star.y - cameraY * 0.1, height);
    ctx.fillRect(x, y, star.size, star.size);
  }
}

function drawCave(ctx: CanvasRenderingContext2D, cave: { x: number; y: number }[]) {
  if (cave.length === 0) {
    return;
  }

  const first = cave[0]!;
  ctx.strokeStyle = UI_LINE_COLOR;
  ctx.lineWidth = UI_LINE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < cave.length; i += 1) {
    const point = cave[i]!;
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawAsteroids(ctx: CanvasRenderingContext2D, asteroids: Asteroid[]) {
  for (const asteroid of asteroids) {
    const points = asteroidShape(asteroid.radius);
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.strokeStyle = UI_LINE_COLOR;
    ctx.lineWidth = UI_LINE_WIDTH;
    ctx.beginPath();
    points.forEach((point, index) => {
      const px = Math.cos(point.angle) * asteroid.radius * point.distance;
      const py = Math.sin(point.angle) * asteroid.radius * point.distance;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
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

function createStarfield() {
  const stars: Star[] = [];
  let seed = 0x12345678;
  for (let i = 0; i < 80; i += 1) {
    seed = nextSeed(seed);
    const x = (seed / 0xffffffff) * STARFIELD_SPAN;
    seed = nextSeed(seed);
    const y = (seed / 0xffffffff) * STARFIELD_SPAN;
    stars.push({
      x,
      y,
      size: i % 5 === 0 ? 1.5 : 1,
      bright: i % 6 === 0,
      pulseOffset: i % 4,
    });
  }
  return stars;
}

function nextSeed(seed: number) {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}
