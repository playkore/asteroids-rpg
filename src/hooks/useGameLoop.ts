import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGameState,
  createInputState,
  resizeGameState,
  restartGame as resetGameState,
  updateGame,
  type HudState,
  type InputState,
  type MapState,
} from '../game';
import { createPlayerStats } from '../rpg';
import { drawGame, drawMiniMap } from '../renderer';
import type { JoystickVector } from './useJoystickInput';

const INITIAL_HUD: HudState = {
  player: createPlayerStats(),
  seed: '',
  gameOver: false,
  ready: false,
};

export function useGameLoop(paused: boolean, started: boolean, seed: string) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniMapRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<ReturnType<typeof createGameState> | null>(null);
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
  const mapState: MapState | null = gameRef.current
    ? {
        rootSeed: gameRef.current.rootSeed,
        currentNode: gameRef.current.currentNode,
        nodeHistory: gameRef.current.nodeHistory,
        graph: gameRef.current.graph,
      }
    : null;

  const initializeGame = useCallback(() => {
    gameRef.current = createGameState(window.innerWidth, window.innerHeight, seed);
    setHud({
      player: { ...gameRef.current.player },
      seed: gameRef.current.seed,
      gameOver: gameRef.current.gameOver,
      ready: !gameRef.current.gameOver && gameRef.current.ship.alive,
    });
  }, [seed]);

  const drawCurrentFrame = useCallback(() => {
    if (!gameRef.current) {
      return;
    }

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

    const miniMapCanvas = miniMapRef.current;
    if (miniMapCanvas) {
      const miniCtx = miniMapCanvas.getContext('2d');
      if (miniCtx) {
        drawMiniMap(
          miniCtx,
          gameRef.current,
          window.devicePixelRatio || 1,
          miniMapCanvas.clientWidth,
          miniMapCanvas.clientHeight,
        );
      }
    }
  }, []);

  const setMovement = useCallback((movement: JoystickVector) => {
    movementRef.current = movement;
  }, []);

  const restartGame = useCallback(() => {
    if (!gameRef.current) {
      initializeGame();
      drawCurrentFrame();
      return;
    }

    resetGameState(gameRef.current);
    inputRef.current = createInputState();
    movementRef.current = { x: 0, y: 0, centerX: 0, centerY: 0, active: false };
    lastFrameRef.current = null;
    setHud({
      player: { ...gameRef.current.player },
      seed: gameRef.current.seed,
      gameOver: gameRef.current.gameOver,
      ready: !gameRef.current.gameOver && gameRef.current.ship.alive,
    });
    drawCurrentFrame();
  }, [drawCurrentFrame, initializeGame]);

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
      if (gameRef.current) {
        resizeGameState(gameRef.current, width, height);
      }

      const miniMapCanvas = miniMapRef.current;
      if (miniMapCanvas) {
        miniMapCanvas.width = Math.floor(miniMapCanvas.clientWidth * dpr);
        miniMapCanvas.height = Math.floor(miniMapCanvas.clientHeight * dpr);
      }

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
    if (!started) {
      gameRef.current = null;
      lastFrameRef.current = null;
      setHud(INITIAL_HUD);
      drawCurrentFrame();
      return;
    }

    if (!gameRef.current) {
      initializeGame();
    }

    if (paused || gameRef.current?.gameOver) {
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
      input.shootRequested = !gameRef.current?.gameOver;
      const flameVisible = movementRef.current.active || input.keyboard.up;

      const nextHud = updateGame(gameRef.current!, input, dt, now);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawGame(ctx, gameRef.current!, now, window.devicePixelRatio || 1, flameVisible);
        }
      }

      const miniMapCanvas = miniMapRef.current;
      if (miniMapCanvas) {
        const miniCtx = miniMapCanvas.getContext('2d');
        if (miniCtx) {
          drawMiniMap(
            miniCtx,
            gameRef.current!,
            window.devicePixelRatio || 1,
            miniMapCanvas.clientWidth,
            miniMapCanvas.clientHeight,
          );
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
  }, [drawCurrentFrame, initializeGame, paused, started, hud.gameOver]);

  return {
    canvasRef,
    miniMapRef,
    hud,
    mapState,
    restartGame,
    setMovement,
  };
}
