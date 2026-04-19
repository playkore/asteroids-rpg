import { describe, expect, it, vi } from 'vitest';
import { createGameState } from '../src/game';
import { asteroidShape, drawGame, drawMiniMap } from '../src/renderer';
import { UI_LINE_COLOR, UI_LINE_WIDTH } from '../src/constants';

function createMockContext() {
  const arc = vi.fn();
  const fillRect = vi.fn();
  const strokeRect = vi.fn();
  const lineWidths: number[] = [];
  let currentLineWidth = 0;
  const context = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect,
    beginPath: vi.fn(),
    arc,
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    rect: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    strokeRect,
    fillStyle: '#000',
    strokeStyle: '#000',
    lineJoin: 'miter',
    lineCap: 'butt',
    lineWidths,
  } as CanvasRenderingContext2D & { lineWidths: number[] };

  Object.defineProperty(context, 'lineWidth', {
    get: () => currentLineWidth,
    set: (value: number) => {
      currentLineWidth = value;
      lineWidths.push(value);
    },
    configurable: true,
  });
  return context;
}

describe('drawGame', () => {
  it('uses the shared UI line width for canvas strokes', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    state.asteroids = [];
    state.bullets = [];

    drawGame(ctx, state, 0, 1, false);

    expect(ctx.lineWidth).toBe(UI_LINE_WIDTH);
    expect(ctx.strokeStyle).toBe(UI_LINE_COLOR);
  });

  it('reuses cached asteroid shapes for the same radius', () => {
    const first = asteroidShape(56);
    const second = asteroidShape(56);

    expect(first).toBe(second);
  });

  it('draws a fixed arena grid and the ship', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    state.asteroids = [];
    state.bullets = [];
    state.ship.alive = true;

    drawGame(ctx, state, 0, 1, false);

    expect(ctx.stroke).toHaveBeenCalled();
    expect((ctx as any).lineWidths).toContain(1);
  });

  it('draws the mini-map with visited cells and a current cell marker', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    state.cells = {
      '0:0': {
        kind: 'combat',
        visited: true,
        cleared: false,
        remaining: { 3: 1, 2: 0, 1: 0 },
      },
      '1:0': {
        kind: 'empty',
        visited: true,
        cleared: true,
        remaining: { 3: 0, 2: 0, 1: 0 },
      },
    };
    state.currentCell = { x: 0, y: 0 };
    state.asteroids = [];

    drawMiniMap(ctx, state, 1, 160, 160);

    expect(ctx.strokeRect).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
