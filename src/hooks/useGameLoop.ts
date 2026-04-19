import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildHudState,
  createGameState,
  createInputState,
  hydrateGameState,
  prepareGameStateForSave,
  resizeGameState,
  restartGame as resetGameState,
  shouldAutoShoot,
  updateGame,
  type GamePhase,
  type GameState,
  type HudState,
  type InputState,
} from '../game';
import { createPlayerStats } from '../rpg';
import {
  buildSaveSlotData,
  createEmptySaveBundle,
  isSaveSlotIndex,
  readSaveBundle,
  setSaveSlot,
  type SaveBundle,
  type SaveSlotData,
  type SaveSlotIndex,
  writeSaveBundle,
} from '../save';
import { drawGame, drawMiniMap } from '../renderer';
import type { JoystickVector } from './useJoystickInput';

const INITIAL_HUD: HudState = {
  player: createPlayerStats(),
  seed: '',
  gameOver: false,
  ready: false,
  cell: { x: 0, y: 0 },
  cellLevel: 1,
  sectorAsteroidHpCurrent: 0,
  sectorAsteroidHpTotal: 0,
  sectorHasAsteroids: false,
  slotIndex: null,
};

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

function createPausedInput() {
  const input = createInputState();
  input.keyboard.left = false;
  input.keyboard.right = false;
  input.keyboard.up = false;
  input.keyboard.down = false;
  input.keyboard.shoot = false;
  input.shootHeld = false;
  input.shootRequested = false;
  return input;
}

export function useGameLoop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniMapRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameState | null>(null);
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
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [saveBundle, setSaveBundle] = useState<SaveBundle>(() => {
    const storage = getStorage();
    return storage ? readSaveBundle(storage) : createEmptySaveBundle();
  });

  const activeSlot = gameRef.current?.slotIndex ?? null;

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

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
  }, []);

  const drawCurrentFrame = useCallback(() => {
    const game = gameRef.current;
    if (!game) {
      return;
    }

    const canvas = canvasRef.current;
    const miniMapCanvas = miniMapRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    drawGame(
      ctx,
      game,
      performance.now(),
      window.devicePixelRatio || 1,
      movementRef.current.active || inputRef.current.keyboard.up,
    );

    if (miniMapCanvas) {
      const miniCtx = miniMapCanvas.getContext('2d');
      if (miniCtx) {
        drawMiniMap(
          miniCtx,
          game,
          performance.now(),
          window.devicePixelRatio || 1,
          miniMapCanvas.clientWidth,
          miniMapCanvas.clientHeight,
        );
      }
    }
  }, []);

  const persistCurrentRun = useCallback(() => {
    const game = gameRef.current;
    if (!game || !isSaveSlotIndex(game.slotIndex ?? -1)) {
      return;
    }

    const slot = game.slotIndex as SaveSlotIndex;
    prepareGameStateForSave(game);
    const storage = getStorage();
    const nextData: SaveSlotData = buildSaveSlotData(game, slot);
    setSaveBundle((current) => {
      const nextBundle = setSaveSlot(current, slot, nextData);
      if (storage) {
        writeSaveBundle(storage, nextBundle);
      }
      return nextBundle;
    });
    game.saveRequested = false;
  }, []);

  const applyLoadedSave = useCallback((slot: SaveSlotIndex, snapshot: SaveSlotData) => {
    gameRef.current = hydrateGameState(snapshot);
    gameRef.current.slotIndex = slot;
    inputRef.current = createInputState();
    movementRef.current = {
      x: 0,
      y: 0,
      centerX: 0,
      centerY: 0,
      active: false,
    };
    lastFrameRef.current = null;
    setHud(buildHudState(gameRef.current, true));
    setPhase('playing');
    const storage = getStorage();
    setSaveBundle((current) => {
      const nextBundle = {
        ...current,
        lastSlot: slot,
        slots: current.slots.slice(),
      };
      nextBundle.slots[slot] = snapshot;
      if (storage) {
        writeSaveBundle(storage, nextBundle);
      }
      return nextBundle;
    });
    drawCurrentFrame();
  }, [drawCurrentFrame]);

  const startNewGame = useCallback((seed: string, slot: SaveSlotIndex) => {
    const game = createGameState(window.innerWidth, window.innerHeight, seed, {
      slotIndex: slot,
    });
    gameRef.current = game;
    inputRef.current = createInputState();
    movementRef.current = {
      x: 0,
      y: 0,
      centerX: 0,
      centerY: 0,
      active: false,
    };
    lastFrameRef.current = null;
    setHud(buildHudState(game, true));
    setPhase('playing');
    const storage = getStorage();
    const nextData = buildSaveSlotData(game, slot);
    setSaveBundle((current) => {
      const nextBundle = setSaveSlot(current, slot, nextData);
      if (storage) {
        writeSaveBundle(storage, nextBundle);
      }
      return nextBundle;
    });
    drawCurrentFrame();
  }, [drawCurrentFrame]);

  const continueGame = useCallback(() => {
    const slot = saveBundle.lastSlot;
    if (slot === null) {
      return;
    }
    const snapshot = saveBundle.slots[slot];
    if (!snapshot) {
      return;
    }
    applyLoadedSave(slot, snapshot);
  }, [applyLoadedSave, saveBundle]);

  const loadGame = useCallback((slot: SaveSlotIndex) => {
    const snapshot = saveBundle.slots[slot];
    if (!snapshot) {
      return;
    }
    applyLoadedSave(slot, snapshot);
  }, [applyLoadedSave, saveBundle]);

  const pauseGame = useCallback(() => {
    if (phase !== 'playing') {
      return;
    }
    persistCurrentRun();
    setPhase('paused');
    inputRef.current = createPausedInput();
    lastFrameRef.current = null;
    drawCurrentFrame();
  }, [drawCurrentFrame, phase, persistCurrentRun]);

  const resumeGame = useCallback(() => {
    if (!gameRef.current || phase !== 'paused') {
      return;
    }
    setPhase('playing');
    lastFrameRef.current = null;
    drawCurrentFrame();
  }, [drawCurrentFrame, phase]);

  const openMenu = useCallback(() => {
    if (phase === 'playing') {
      pauseGame();
      return;
    }
    setPhase('menu');
    lastFrameRef.current = null;
    drawCurrentFrame();
  }, [drawCurrentFrame, pauseGame, phase]);

  const restartCurrentGame = useCallback(() => {
    if (!gameRef.current) {
      return;
    }
    resetGameState(gameRef.current);
    gameRef.current.slotIndex = activeSlot;
    inputRef.current = createInputState();
    movementRef.current = {
      x: 0,
      y: 0,
      centerX: 0,
      centerY: 0,
      active: false,
    };
    lastFrameRef.current = null;
    setHud(buildHudState(gameRef.current, true));
    setPhase('playing');
    persistCurrentRun();
    drawCurrentFrame();
  }, [drawCurrentFrame, persistCurrentRun]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resize = () => {
      syncCanvasSize();
      drawCurrentFrame();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [drawCurrentFrame, syncCanvasSize]);

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
    if (phase !== 'playing' || !gameRef.current) {
      lastFrameRef.current = null;
      return;
    }

    const tick = (now: number) => {
      const game = gameRef.current;
      if (!game || phase !== 'playing') {
        return;
      }

      const last = lastFrameRef.current ?? now;
      const dt = Math.min((now - last) / 1000, 0.033);
      lastFrameRef.current = now;

      const input = inputRef.current;
      input.moveX = movementRef.current.active ? movementRef.current.x : 0;
      input.moveY = movementRef.current.active ? movementRef.current.y : 0;
      input.shootRequested = shouldAutoShoot(game);

      const nextHud = updateGame(game, input, dt, now);
      setHud(nextHud);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawGame(ctx, game, now, window.devicePixelRatio || 1, movementRef.current.active || input.keyboard.up);
        }
      }

      const miniMapCanvas = miniMapRef.current;
      if (miniMapCanvas) {
        const miniCtx = miniMapCanvas.getContext('2d');
        if (miniCtx) {
          drawMiniMap(
            miniCtx,
            game,
            now,
            window.devicePixelRatio || 1,
            miniMapCanvas.clientWidth,
            miniMapCanvas.clientHeight,
          );
        }
      }

      if (game.saveRequested) {
        persistCurrentRun();
      }

      if (nextHud.gameOver) {
        persistCurrentRun();
        setPhase('gameover');
        lastFrameRef.current = null;
        return;
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [phase, persistCurrentRun]);

  useEffect(() => {
    if (phase === 'playing' && gameRef.current) {
      drawCurrentFrame();
    }
  }, [drawCurrentFrame, phase]);

  return {
    canvasRef,
    miniMapRef,
    hud,
    phase,
    saveBundle,
    activeSlot,
    startNewGame,
    continueGame,
    loadGame,
    pauseGame,
    resumeGame,
    openMenu,
    setMovement: (movement: JoystickVector) => {
      movementRef.current = movement;
    },
    restartCurrentGame,
    setPhase,
  };
}
