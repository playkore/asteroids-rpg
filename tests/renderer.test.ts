import { describe, expect, it, vi } from 'vitest';
import { createGameState } from '../src/game';
import { asteroidShape, drawGame, drawMiniMap } from '../src/renderer';
import { UI_LINE_COLOR, UI_LINE_WIDTH } from '../src/constants';

function createMockContext() {
  const arc = vi.fn();
  const lineWidths: number[] = [];
  let currentLineWidth = 0;
  const context = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
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
    strokeRect: vi.fn(),
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
    state.deadEnds = [];

    drawGame(ctx, state, 0, 1, false);

    expect(ctx.lineWidth).toBe(UI_LINE_WIDTH);
    expect(ctx.strokeStyle).toBe(UI_LINE_COLOR);
  });

  it('reuses cached asteroid shapes for the same radius', () => {
    const first = asteroidShape(56);
    const second = asteroidShape(56);

    expect(first).toBe(second);
  });

  it('does not draw stars', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    state.asteroids = [];
    state.bullets = [];
    state.deadEnds = [];

    drawGame(ctx, state, 0, 1, false);

    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
  });

  it('draws a thin background grid', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    state.ship.alive = false;
    state.asteroids = [
      {
        x: 20,
        y: 10,
        vx: 0,
        vy: 0,
        size: 3,
        radius: 56,
      },
    ];
    state.bullets = [];
    state.deadEnds = [];

    drawGame(ctx, state, 0, 1, false);

    expect(ctx.clip).toHaveBeenCalledTimes(1);
    expect(ctx.stroke).toHaveBeenCalledTimes(3);
    expect(ctx.fill).toHaveBeenCalledTimes(1);
    expect((ctx as any).lineWidths).toContain(1);
  });

  it('centers the minimap on the ship', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    state.asteroids = [];
    state.bullets = [];

    drawMiniMap(ctx, state, 1, 160, 160);

    expect(ctx.strokeRect).toHaveBeenCalledTimes(1);
    expect((ctx as any).arc.mock.calls.at(-1)).toEqual([80, 80, 2.5, 0, Math.PI * 2]);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('moves world objects relative to the ship on the minimap', () => {
    const state = createGameState(320, 240);
    state.asteroids = [
      {
        x: 100,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        radius: 56,
      },
    ];

    const firstCtx = createMockContext();
    drawMiniMap(firstCtx, state, 1, 160, 160);
    const firstX = (firstCtx as any).arc.mock.calls[0][0] as number;

    const secondCtx = createMockContext();
    state.ship.x = 50;
    drawMiniMap(secondCtx, state, 1, 160, 160);
    const secondX = (secondCtx as any).arc.mock.calls[0][0] as number;

    expect(secondX).toBeLessThan(firstX);
  });

  it('does not draw bullets on the minimap', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    state.asteroids = [];
    state.bullets = [
      {
        x: 120,
        y: 0,
        vx: 0,
        vy: 0,
        life: 1,
      },
    ];

    drawMiniMap(ctx, state, 1, 160, 160);

    expect((ctx as any).arc.mock.calls).toHaveLength(1);
  });

  it('draws dead-end circles on the main screen', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    state.cave = [
      { x: -20, y: -20 },
      { x: 20, y: -20 },
      { x: 20, y: 20 },
      { x: -20, y: 20 },
    ];
    state.deadEnds = [{ x: 10, y: 0 }];
    state.asteroids = [];
    state.bullets = [];

    drawGame(ctx, state, 0, 1, false);

    expect((ctx as any).arc.mock.calls).toHaveLength(1);
  });
});
