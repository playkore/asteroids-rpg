import { describe, expect, it, vi } from 'vitest';
import { createGameState } from '../src/game';
import { drawGame } from '../src/renderer';
import { UI_LINE_COLOR, UI_LINE_WIDTH } from '../src/constants';

function createMockContext() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
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
});
