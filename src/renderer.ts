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
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, width, height);

  drawStarfield(ctx, width, height, now);
  drawAsteroids(ctx, state.asteroids);
  drawBullets(ctx, state.bullets);
  drawShip(ctx, state.ship, flameVisible);
}

export function getStarfield() {
  return STARFIELD;
}

function drawStarfield(ctx: CanvasRenderingContext2D, width: number, height: number, now: number) {
  const twinkleFrame = Math.floor(now / 180);
  for (const star of STARFIELD) {
    ctx.fillStyle =
      ((twinkleFrame + star.pulseOffset) & 3) === 0
        ? BRIGHT_STARS
        : star.bright
          ? BRIGHT_STARS
          : DIM_STARS;
    ctx.fillRect(star.x * width, star.y * height, star.size, star.size);
  }
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
    const x = seed / 0xffffffff;
    seed = nextSeed(seed);
    const y = seed / 0xffffffff;
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
