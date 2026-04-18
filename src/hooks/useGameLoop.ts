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
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [drawCurrentFrame, paused]);

  const beginFire = useCallback(() => {
    inputRef.current.shootRequested = true;
    inputRef.current.shootHeld = true;
  }, []);

  const endFire = useCallback(() => {
    inputRef.current.shootHeld = false;
  }, []);

  return {
    canvasRef,
    hud,
    restartGame,
    setMovement,
    beginFire,
    endFire,
  };
}
