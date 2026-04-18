import { describe, expect, it, vi } from 'vitest';
import { createGameState } from '../src/game';
import { asteroidShape, drawGame, drawMiniMap } from '../src/renderer';
import { UI_LINE_COLOR, UI_LINE_WIDTH } from '../src/constants';

function createMockContext() {
  const arc = vi.fn();
  return {
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
    lineWidth: 0,
    lineJoin: 'miter',
    lineCap: 'butt',
  } as unknown as CanvasRenderingContext2D;
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

  it('does not draw stars', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    state.asteroids = [];
    state.bullets = [];

    drawGame(ctx, state, 0, 1, false);

    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
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
});
