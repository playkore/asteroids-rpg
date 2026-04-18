<source_code>
AGENTS.md
```
# UX Directions

- Mobile-first controls.
- Use simple line-based visuals with a consistent stroke thickness across the ship, asteroids, joystick, fire button, HUD, overlays, and labels.
- Avoid semi-transparency and opacity effects anywhere in the UI.
- Avoid fully transparent placeholders too; if something is hidden, prefer `display: none` or match the background color.
- Avoid gradients, blur, backdrop filters, glow, or other soft translucent treatments.
- Prefer solid dark backgrounds with light linework and a small, disciplined color palette.
- Keep text in a thin monospaced style that matches the line weight of the game art as closely as possible.
- The virtual joystick should appear only while the user is actively pressing or dragging on the play area.
- The fire control should be icon-only and visually consistent with the rest of the line-art UI.
- Keep any helper text to a minimum; remove instructional clutter when it competes with gameplay.
- Every code change must be covered by unit tests, either by adding new tests or updating existing ones to match the changed behavior.

# Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
```

index.html
```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#07111f" />
    <title>Asteroids</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

package.json
```
{
  "name": "asteroids-rpg",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@types/node": "^22.15.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0"
  }
}
```

tsconfig.json
```
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "types": ["vite/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

tsconfig.node.json
```
{
  "compilerOptions": {
    "composite": true,
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

vite.config.ts
```
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/asteroids-rpg/' : '/',
});
```

src/App.tsx
```
import { useEffect, useState } from 'react';
import FloatingControls from './components/FloatingControls';
import Hud from './components/Hud';
import MapOverlay from './components/MapOverlay';
import MapToggleButton from './components/MapToggleButton';
import { useGameLoop } from './hooks/useGameLoop';
import { useScreenMode } from './hooks/useScreenMode';

export default function App() {
  const [mapOpen, setMapOpen] = useState(false);
  const { hud, canvasRef, restartGame, setMovement } = useGameLoop(mapOpen);
  const screen = useScreenMode(hud.gameOver, mapOpen, setMapOpen);

  useEffect(() => {
    if (screen.mode !== 'play') {
      setMovement({ x: 0, y: 0, centerX: 0, centerY: 0, active: false });
    }
  }, [screen.mode, setMovement]);

  return (
    <main className="app">
      <canvas ref={canvasRef} className="game-canvas" />

      <Hud hud={hud} />
      {!screen.mapOpen ? (
        <MapToggleButton open={screen.mapOpen} onToggle={screen.toggleMap} />
      ) : null}

      {hud.gameOver ? (
        <div className="overlay">
          <div className="overlay__panel">
            <h1>Game Over</h1>
            <button className="overlay__button" type="button" onClick={restartGame}>
              Restart
            </button>
          </div>
        </div>
      ) : null}

      {screen.mapOpen ? <MapOverlay onClose={screen.closeMap} /> : null}

      <FloatingControls
        enabled={screen.mode === 'play'}
        onMovementChange={setMovement}
      />
    </main>
  );
}
```

src/Map.tsx
```
export default function Map() {
  return <div className="map" aria-label="Map view" />;
}
```

src/game.ts
```
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
    ctx.strokeStyle = '#dce4ee';
    ctx.lineWidth = 2.5;
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
  ctx.fillStyle = '#fff1a8';
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
  ctx.strokeStyle = '#f4fbff';
  ctx.lineWidth = 2.5;
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

function loseLife(state: GameState, now: number) {
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

function wrap(value: number, max: number) {
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
```

src/main.tsx
```
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

src/styles.css
```
:root {
  color-scheme: dark;
  font-family: ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  --bg: #05070c;
  --line: #8f99a6;
  --line-strong: #e1e8f1;
  --text: #f5f9ff;
  --muted: #a8b2bf;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
}

body {
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
}

button {
  font: inherit;
}

.app {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  touch-action: none;
}

.game-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.hud {
  position: absolute;
  top: max(env(safe-area-inset-top), 14px);
  left: 12px;
  right: 76px;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  pointer-events: none;
  z-index: 2;
}

.controls-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.controls-surface {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  touch-action: none;
}

.controls-layer.is-disabled .controls-surface {
  pointer-events: none;
}

.hud__pill {
  min-width: 0;
  flex: 1;
  max-width: 120px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 2px solid #303844;
  background: #070a10;
}

.hud__pill span {
  display: block;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--muted);
}

.hud__pill strong {
  display: block;
  margin-top: 4px;
  font-size: 1.08rem;
  line-height: 1;
  font-weight: 400;
}

.joystick__base,
.joystick__knob {
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.joystick {
  position: absolute;
  width: 144px;
  height: 144px;
  border-radius: 50%;
  border: 2px solid #c5cfda;
  background: #090d13;
  pointer-events: none;
  touch-action: none;
  -webkit-tap-highlight-color: #05070c;
  display: none;
  transform: translate3d(-1000px, -1000px, 0);
  z-index: 4;
}

.joystick__base {
  width: 144px;
  height: 144px;
  border: 2px solid #2f3743;
  background: #090d13;
}

.joystick__knob {
  width: 58px;
  height: 58px;
  border: 2px solid #dce4ee;
  background: #111720;
  transform: translate(calc(-50% + var(--knob-x, 0px)), calc(-50% + var(--knob-y, 0px)));
}

.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: #05070c;
  z-index: 6;
  pointer-events: auto;
}

.map-toggle {
  position: absolute;
  top: max(env(safe-area-inset-top), 14px);
  right: 14px;
  width: 48px;
  height: 48px;
  border: 2px solid #c5cfda;
  border-radius: 12px;
  background: #090d13;
  padding: 0;
  display: grid;
  place-items: center;
  pointer-events: auto;
  z-index: 4;
}

.map-toggle__frame,
.map-toggle__grid {
  position: absolute;
}

.map-toggle__frame {
  inset: 11px;
  border: 2px solid #dce4ee;
  border-radius: 7px;
}

.map-toggle__grid {
  width: 18px;
  height: 18px;
  background:
    linear-gradient(#dce4ee, #dce4ee) 50% 0 / 2px 100% no-repeat,
    linear-gradient(#dce4ee, #dce4ee) 0 50% / 100% 2px no-repeat;
}

.overlay__panel {
  width: min(90vw, 360px);
  padding: 24px;
  border-radius: 18px;
  border: 2px solid #303844;
  background: #070a10;
  text-align: center;
}

.overlay__panel h1 {
  margin: 0;
  font-size: clamp(2rem, 9vw, 3rem);
  letter-spacing: 0.08em;
  font-weight: 400;
}

.overlay__button {
  border: 2px solid #c5cfda;
  padding: 12px 20px;
  border-radius: 999px;
  font-weight: 400;
  color: var(--text);
  background: #090d13;
  letter-spacing: 0.12em;
}

.map-overlay {
  position: absolute;
  inset: 0;
  background: #05070c;
  z-index: 3;
}

.map-overlay__close {
  position: absolute;
  top: max(env(safe-area-inset-top), 14px);
  right: 14px;
  border: 2px solid #c5cfda;
  border-radius: 999px;
  background: #090d13;
  color: var(--text);
  padding: 10px 16px;
  letter-spacing: 0.12em;
  z-index: 4;
}

.map {
  position: absolute;
  inset: 0;
}

@media (min-width: 768px) {
  .hud {
    left: 18px;
    right: 90px;
    width: auto;
    gap: 12px;
  }

  .map-toggle,
  .map-overlay__close {
    right: 24px;
  }

}
```

.codex/environments/environment.toml
```
# THIS IS AUTOGENERATED. DO NOT EDIT MANUALLY
version = 1
name = "asteroids-rpg"

[setup]
script = ""

[[actions]]
name = "Run"
icon = "run"
command = "npm run dev"
```

.github/workflows/deploy-pages.yml
```
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAGES: 'true'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

src/components/FloatingControls.tsx
```
import { useEffect, type CSSProperties } from 'react';
import { useJoystickInput, type JoystickVector } from '../hooks/useJoystickInput';

const JOYSTICK_RADIUS = 56;

export default function FloatingControls({
  enabled,
  onMovementChange,
}: {
  enabled: boolean;
  onMovementChange: (movement: JoystickVector) => void;
}) {
  const { vector, bindings, reset } = useJoystickInput({
    enabled,
    radius: JOYSTICK_RADIUS,
    onChange: onMovementChange,
  });

  useEffect(() => {
    if (!enabled) {
      reset();
    }
  }, [enabled, reset]);

  return (
    <div className={`controls-layer${enabled ? '' : ' is-disabled'}`} aria-hidden={!enabled}>
      <div className="controls-surface" {...bindings} />

      <div
        className={`joystick${vector.active ? ' is-active' : ''}`}
        aria-hidden="true"
        style={(
          vector.active
            ? {
                display: 'grid',
                left: `${vector.centerX}px`,
                top: `${vector.centerY}px`,
                transform: 'translate(-50%, -50%)',
                '--knob-x': `${vector.x * JOYSTICK_RADIUS}px`,
                '--knob-y': `${vector.y * JOYSTICK_RADIUS}px`,
              }
            : { display: 'none' }
        ) as CSSProperties}
        >
        <span className="joystick__base" />
        <span className="joystick__knob" />
      </div>
    </div>
  );
}
```

src/components/Hud.tsx
```
import type { HudState } from '../game';

export default function Hud({ hud }: { hud: Pick<HudState, 'score' | 'lives' | 'wave'> }) {
  return (
    <div className="hud">
      <div className="hud__pill">
        <span>Score</span>
        <strong>{hud.score}</strong>
      </div>
      <div className="hud__pill">
        <span>Lives</span>
        <strong>{hud.lives}</strong>
      </div>
      <div className="hud__pill">
        <span>Wave</span>
        <strong>{hud.wave}</strong>
      </div>
    </div>
  );
}
```

src/components/MapOverlay.tsx
```
import Map from '../Map';

export default function MapOverlay({ onClose }: { onClose: () => void }) {
  return (
    <section className="map-overlay" aria-label="Map overlay">
      <button className="map-overlay__close" type="button" onClick={onClose}>
        Close
      </button>
      <Map />
    </section>
  );
}
```

src/components/MapToggleButton.tsx
```
export default function MapToggleButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="map-toggle"
      type="button"
      onClick={onToggle}
      aria-label={open ? 'Close map' : 'Open map'}
      aria-pressed={open}
    >
      <span className="map-toggle__frame" />
      <span className="map-toggle__grid" />
    </button>
  );
}
```

src/hooks/useGameLoop.ts
```
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGameState,
  createInputState,
  drawGame,
  resizeGameState,
  restartGame as resetGameState,
  updateGame,
  type HudState,
  type InputState,
} from '../game';
import type { JoystickVector } from './useJoystickInput';

const INITIAL_HUD: HudState = {
  score: 0,
  lives: 3,
  wave: 1,
  gameOver: false,
  ready: false,
};

export function useGameLoop(paused: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef(createGameState(360, 640));
  const inputRef = useRef<InputState>(createInputState());
  const movementRef = useRef<JoystickVector>({
    x: 0,
    y: 0,
    centerX: 0,
    centerY: 0,
    active: false,
  });
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const [hud, setHud] = useState<HudState>(INITIAL_HUD);

  const drawCurrentFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    drawGame(
      ctx,
      gameRef.current,
      performance.now(),
      window.devicePixelRatio || 1,
      movementRef.current.active || inputRef.current.keyboard.up,
    );
  }, []);

  const setMovement = useCallback((movement: JoystickVector) => {
    movementRef.current = movement;
  }, []);

  const restartGame = useCallback(() => {
    resetGameState(gameRef.current);
    inputRef.current = createInputState();
    movementRef.current = { x: 0, y: 0, centerX: 0, centerY: 0, active: false };
    lastFrameRef.current = null;
    setHud({
      score: gameRef.current.score,
      lives: gameRef.current.lives,
      wave: gameRef.current.wave,
      gameOver: gameRef.current.gameOver,
      ready: !gameRef.current.gameOver && gameRef.current.ship.alive,
    });
    drawCurrentFrame();
  }, [drawCurrentFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      resizeGameState(gameRef.current, width, height);
      drawCurrentFrame();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [drawCurrentFrame]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const input = inputRef.current;
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') input.keyboard.left = true;
      if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') input.keyboard.right = true;
      if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') input.keyboard.up = true;
      if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') input.keyboard.down = true;
      if (event.key === ' ' || event.key === 'Enter') input.keyboard.shoot = true;
      if (event.key === 'r' || event.key === 'R') input.keyboard.restart = true;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const input = inputRef.current;
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') input.keyboard.left = false;
      if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') input.keyboard.right = false;
      if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') input.keyboard.up = false;
      if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') input.keyboard.down = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (paused || gameRef.current.gameOver) {
      lastFrameRef.current = null;
      drawCurrentFrame();
      return;
    }

    const tick = (now: number) => {
      const last = lastFrameRef.current ?? now;
      const dt = Math.min((now - last) / 1000, 0.033);
      lastFrameRef.current = now;

      const input = inputRef.current;
      input.moveX = movementRef.current.active ? movementRef.current.x : 0;
      input.moveY = movementRef.current.active ? movementRef.current.y : 0;
      input.shootRequested = !gameRef.current.gameOver;
      const flameVisible = movementRef.current.active || input.keyboard.up;

      const nextHud = updateGame(gameRef.current, input, dt, now);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawGame(ctx, gameRef.current, now, window.devicePixelRatio || 1, flameVisible);
        }
      }

      setHud(nextHud);
      if (!nextHud.gameOver) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [drawCurrentFrame, paused, hud.gameOver]);

  return {
    canvasRef,
    hud,
    restartGame,
    setMovement,
  };
}
```

src/hooks/useJoystickInput.ts
```
import { useCallback, useMemo, useRef, useState } from 'react';
import type { PointerEventHandler } from 'react';

export type JoystickVector = {
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  active: boolean;
};

export type JoystickBindings = {
  onPointerDown: PointerEventHandler<HTMLElement>;
  onPointerMove: PointerEventHandler<HTMLElement>;
  onPointerUp: PointerEventHandler<HTMLElement>;
  onPointerCancel: PointerEventHandler<HTMLElement>;
};

type JoystickState = {
  active: boolean;
  pointerId: number | null;
  centerX: number;
  centerY: number;
  x: number;
  y: number;
};

export function useJoystickInput({
  enabled,
  radius,
  onChange,
}: {
  enabled: boolean;
  radius: number;
  onChange: (vector: JoystickVector) => void;
}) {
  const stateRef = useRef<JoystickState>({
    active: false,
    pointerId: null,
    centerX: 0,
    centerY: 0,
    x: 0,
    y: 0,
  });
  const [viewState, setViewState] = useState<JoystickVector>({
    x: 0,
    y: 0,
    centerX: 0,
    centerY: 0,
    active: false,
  });

  const emit = useCallback(() => {
    const state = stateRef.current;
    const next = {
      x: state.active ? state.x : 0,
      y: state.active ? state.y : 0,
      centerX: state.centerX,
      centerY: state.centerY,
      active: state.active,
    };
    setViewState(next);
    onChange(next);
  }, [onChange]);

  const reset = useCallback(() => {
    const state = stateRef.current;
    state.active = false;
    state.pointerId = null;
    state.x = 0;
    state.y = 0;
    emit();
  }, [emit]);

  const onPointerDown = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      if (!enabled) {
        return;
      }

      const state = stateRef.current;
      state.active = true;
      state.pointerId = event.pointerId;
      state.centerX = event.clientX;
      state.centerY = event.clientY;
      state.x = 0;
      state.y = 0;
      event.currentTarget.setPointerCapture(event.pointerId);
      emit();
    },
    [enabled, emit],
  );

  const onPointerMove = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      const state = stateRef.current;
      if (!state.active || state.pointerId !== event.pointerId) {
        return;
      }

      const dx = event.clientX - state.centerX;
      const dy = event.clientY - state.centerY;
      const length = Math.hypot(dx, dy);
      const clamped = Math.min(length, radius);
      const factor = clamped / radius;
      const nx = length > 0 ? dx / length : 0;
      const ny = length > 0 ? dy / length : 0;
      state.x = nx * factor;
      state.y = ny * factor;
      emit();
    },
    [emit, radius],
  );

  const endPointer = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      const state = stateRef.current;
      if (state.pointerId !== event.pointerId) {
        return;
      }

      reset();
    },
    [reset],
  );

  const bindings = useMemo<JoystickBindings>(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
    }),
    [endPointer, onPointerDown, onPointerMove],
  );

  return {
    vector: viewState,
    bindings,
    reset,
  };
}
```

src/hooks/useScreenMode.ts
```
import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';

export type ScreenMode = 'play' | 'map' | 'gameover';

export function useScreenMode(
  gameOver: boolean,
  mapOpen: boolean,
  setMapOpen: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (gameOver) {
      setMapOpen(false);
    }
  }, [gameOver, setMapOpen]);

  const openMap = useCallback(() => {
    if (!gameOver) {
      setMapOpen(true);
    }
  }, [gameOver]);

  const closeMap = useCallback(() => {
    setMapOpen(false);
  }, []);

  const toggleMap = useCallback(() => {
    if (!gameOver) {
      setMapOpen((value) => !value);
    }
  }, [gameOver]);

  const mode: ScreenMode = gameOver ? 'gameover' : mapOpen ? 'map' : 'play';

  return {
    mode,
    mapOpen,
    openMap,
    closeMap,
    toggleMap,
  };
}
```

</source_code>