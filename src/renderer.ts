import type { Asteroid, Bullet, GameState, Ship } from './game';
import { UI_LINE_COLOR, UI_LINE_WIDTH } from './constants';

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

function drawStarfield(ctx: CanvasRenderingContext2D, width: number, height: number, now: number) {
  const stars = 80;
  for (let i = 0; i < stars; i += 1) {
    const x = (Math.sin(i * 999 + now * 0.00003) * 0.5 + 0.5) * width;
    const y = (Math.sin(i * 321 + now * 0.00004) * 0.5 + 0.5) * height;
    const size = i % 5 === 0 ? 1.5 : 1;
    ctx.fillStyle = i % 6 === 0 ? '#dce4ee' : '#7f8b98';
    ctx.fillRect(x, y, size, size);
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

function asteroidShape(radius: number) {
  const segments = 9;
  return Array.from({ length: segments }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2;
    const distance = 0.78 + 0.27 * Math.sin(radius * 0.11 + index * 2.1);
    return { angle, distance };
  });
}
