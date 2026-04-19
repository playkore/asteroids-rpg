import { describe, expect, it, vi } from 'vitest';
import { createGameState } from '../src/game';
import { asteroidShape, buildMiniMapLayout, drawGame, drawMiniMap } from '../src/renderer';
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
    scale: vi.fn(),
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

  it('hides the ship while it is blinking after a respawn', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    state.asteroids = [];
    state.bullets = [];
    state.respawnBlinkUntil = 1000;

    drawGame(ctx, state, 180, 1, false);

    expect(ctx.translate).not.toHaveBeenCalled();
  });

  it('draws feedback effects with shake, streaks, flashes, and hit pulses', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    state.ship.x = 160;
    state.ship.y = 120;
    state.ship.angle = 0;
    state.asteroids = [
      {
        x: 60,
        y: 70,
        vx: 0,
        vy: 0,
        size: 3,
        radius: 56,
        hp: 10,
        maxHp: 12,
        xpReward: 4,
        contactDamage: 3,
        hpVisible: true,
        hitFlashUntil: 1100,
        hitScaleUntil: 1100,
      },
    ];
    state.bullets = [
      {
        x: 100,
        y: 100,
        vx: 200,
        vy: 0,
        life: 1,
        damage: 1,
        trailUntil: 1100,
      },
    ];
    state.particles = [
      {
        x: 30,
        y: 40,
        vx: 50,
        vy: 0,
        life: 0.12,
        maxLife: 0.24,
        size: 2,
        kind: 'spark',
      },
    ];
    state.flashes = [
      {
        x: 80,
        y: 90,
        radius: 12,
        until: 1100,
      },
    ];
    state.shake = {
      amplitude: 3,
      until: 1100,
    };

    drawGame(ctx, state, 1000, 1, true);

    expect(ctx.translate).toHaveBeenCalled();
    const firstTranslate = (ctx.translate as any).mock.calls[0];
    expect(firstTranslate[0]).not.toBe(0);
    expect(firstTranslate[1]).not.toBe(0);
    expect((ctx.translate as any).mock.calls.some(([x, y]: [number, number]) => x === 160 && y === 120)).toBe(true);
    expect(ctx.scale).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('draws the mini-map with visited cells and a current cell marker', () => {
    const ctx = createMockContext();
    const state = createGameState(320, 240);
    const current = { x: 0, y: 0 };
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
      '1:1': {
        kind: 'combat',
        visited: true,
        cleared: false,
        remaining: { 3: 1, 2: 0, 1: 0 },
      },
      '0:1': {
        kind: 'combat',
        visited: false,
        cleared: false,
        remaining: { 3: 3, 2: 0, 1: 0 },
      },
    };
    state.currentCell = current;
    state.asteroids = [];

    drawMiniMap(ctx, state, 0, 1, 160, 160);

    expect(ctx.strokeRect).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    expect(ctx.fillRect).not.toHaveBeenCalledWith(0, 0, 160, 160);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 160, 160);
    expect(ctx.strokeStyle).toBe('#f5f9ff');
    expect(ctx.lineTo).toHaveBeenCalledTimes(2);
    expect(buildMiniMapLayout(state, 160, 160).cells).toHaveLength(49);
    const centerCell = buildMiniMapLayout(state, 160, 160).cells[24];
    expect(centerCell?.current).toBe(true);
    expect(centerCell?.key).toBe('0:0');
    expect(ctx.strokeRect).toHaveBeenCalledTimes(3);
  });

  it('always centers the current cell in a 7x7 mini-map layout', () => {
    const state = createGameState(320, 240);
    state.currentCell = { x: 6, y: 0 };
    state.cells = {
      '6:0': {
        kind: 'combat',
        visited: true,
        cleared: false,
        remaining: { 3: 1, 2: 0, 1: 0 },
      },
      '0:0': {
        kind: 'combat',
        visited: true,
        cleared: false,
        remaining: { 3: 0, 2: 1, 1: 0 },
      },
      '6:-1': {
        kind: 'empty',
        visited: true,
        cleared: false,
        remaining: { 3: 0, 2: 0, 1: 0 },
      },
    };

    const layout = buildMiniMapLayout(state, 160, 160);

    expect(layout.cells).toHaveLength(49);
    expect(layout.cells[24]?.key).toBe('6:0');
    expect(layout.cells[24]?.current).toBe(true);
    expect(layout.cells.some((cell) => cell.key === '0:0')).toBe(true);
  });
});
