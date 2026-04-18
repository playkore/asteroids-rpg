import { useEffect, useRef, useState } from 'react';
import {
  createGameState,
  createInputState,
  drawGame,
  resizeGameState,
  updateGame,
  type HudState,
  type InputState,
} from './game';

type JoystickState = {
  active: boolean;
  pointerId: number | null;
  centerX: number;
  centerY: number;
  x: number;
  y: number;
};

const JOYSTICK_RADIUS = 56;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<InputState>(createInputState());
  const gameRef = useRef(createGameState(360, 640));
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const joystickRef = useRef<JoystickState>({
    active: false,
    pointerId: null,
    centerX: 0,
    centerY: 0,
    x: 0,
    y: 0,
  });
  const joystickUiRef = useRef<HTMLDivElement | null>(null);
  const [hud, setHud] = useState<HudState>({
    score: 0,
    lives: 3,
    wave: 1,
    gameOver: false,
    ready: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
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
      drawGame(ctx, gameRef.current, performance.now(), dpr, false);
    };

    resize();
    window.addEventListener('resize', resize);

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

    const tick = (now: number) => {
      const last = lastFrameRef.current ?? now;
      const dt = Math.min((now - last) / 1000, 0.033);
      lastFrameRef.current = now;

      const input = inputRef.current;
      input.moveX = joystickRef.current.active ? joystickRef.current.x : 0;
      input.moveY = joystickRef.current.active ? joystickRef.current.y : 0;

      const nextHud = updateGame(gameRef.current, input, dt, now);
      const flameVisible = Math.hypot(input.moveX, input.moveY) > 0.01;
      drawGame(ctx, gameRef.current, now, window.devicePixelRatio || 1, flameVisible);
      setHud(nextHud);
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const updateJoystickUi = () => {
    const el = joystickUiRef.current;
    const js = joystickRef.current;
    if (!el) return;
    el.style.display = js.active ? 'grid' : 'none';
    el.style.left = `${js.centerX}px`;
    el.style.top = `${js.centerY}px`;
    el.style.transform = 'translate(-50%, -50%)';
    el.style.setProperty('--knob-x', `${js.x * JOYSTICK_RADIUS}px`);
    el.style.setProperty('--knob-y', `${js.y * JOYSTICK_RADIUS}px`);
  };

  const pointerToJoystick = (event: React.PointerEvent<HTMLElement>) => {
    const js = joystickRef.current;
    js.active = true;
    js.pointerId = event.pointerId;
    js.centerX = event.clientX;
    js.centerY = event.clientY;
    js.x = 0;
    js.y = 0;
    updateJoystickUi();
  };

  const onAppPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('.fire') || target.closest('.overlay')) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerToJoystick(event);
  };

  const onAppPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const js = joystickRef.current;
    if (!js.active || js.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - js.centerX;
    const dy = event.clientY - js.centerY;
    const length = Math.hypot(dx, dy);
    const max = JOYSTICK_RADIUS;
    const clamped = Math.min(length, max);
    const factor = clamped / max;
    const nx = length > 0 ? dx / length : 0;
    const ny = length > 0 ? dy / length : 0;
    js.x = nx * factor;
    js.y = ny * factor;
    updateJoystickUi();
  };

  const endJoystick = (event: React.PointerEvent<HTMLElement>) => {
    const js = joystickRef.current;
    if (js.pointerId !== event.pointerId) {
      return;
    }
    js.active = false;
    js.pointerId = null;
    js.x = 0;
    js.y = 0;
    inputRef.current.moveX = 0;
    inputRef.current.moveY = 0;
    updateJoystickUi();
  };

  return (
    <main
      className="app"
      onPointerDown={onAppPointerDown}
      onPointerMove={onAppPointerMove}
      onPointerUp={endJoystick}
      onPointerCancel={endJoystick}
    >
      <canvas ref={canvasRef} className="game-canvas" />

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

      {hud.gameOver ? (
        <div className="overlay">
          <div className="overlay__panel">
            <h1>Game Over</h1>
            <button
              className="overlay__button"
              onClick={() => {
                inputRef.current.keyboard.restart = true;
              }}
            >
              Restart
            </button>
          </div>
        </div>
      ) : null}

      <div ref={joystickUiRef} className="joystick" aria-hidden="true">
        <span className="joystick__base" />
        <span className="joystick__knob" />
      </div>

      <button
        className="fire"
        onPointerDown={(event) => {
          event.stopPropagation();
          inputRef.current.shootRequested = true;
          inputRef.current.shootHeld = true;
        }}
        onPointerUp={() => {
          inputRef.current.shootHeld = false;
        }}
        onPointerCancel={() => {
          inputRef.current.shootHeld = false;
        }}
        aria-label="Shoot"
      >
        <span className="fire__ring" />
        <span className="fire__plus" />
      </button>
    </main>
  );
}
