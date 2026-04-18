// src/game.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateCave, isPointInsidePolygon } from './cave';
import { createGameState, createInputState, linesIntersect, updateGame } from './game';
import { deriveSeed } from './seed';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('game logic', () => {
  it('creates a large maze cave and spawns the ship at the origin', () => {
    const state = createGameState(800, 600);

    expect(state.ship.x).toBe(0);
    expect(state.ship.y).toBe(0);
    expect(state.currentNode.seed).toBe(state.seed);
    expect(state.currentNode.depth).toBe(0);
    expect(state.nodeHistory).toHaveLength(0);
    expect(state.cave.length).toBeGreaterThan(100);
    expect(Math.max(...state.cave.map((point) => Math.hypot(point.x, point.y)))).toBeGreaterThan(500);
    expect(state.portals.length).toBeGreaterThan(0);
    expect(state.asteroids.every((asteroid) => Math.hypot(asteroid.x, asteroid.y) > 260)).toBe(true);
  });

  it('traverses portals to deterministic child levels and back again', () => {
    const rootSeed = 'CINDER-5D';
    const state = createGameState(800, 600, rootSeed);
    const forwardPortal = state.portals.find((portal) => portal.connection.kind === 'main');

    expect(forwardPortal).toBeTruthy();
    if (!forwardPortal) {
      return;
    }

    state.ship.x = forwardPortal.x;
    state.ship.y = forwardPortal.y;
    state.asteroids = [];
    state.bullets = [];

    updateGame(state, createInputState(), 0, 1000);

    expect(state.seed).toBe(deriveSeed(rootSeed, forwardPortal.key));
    expect(state.currentNode.enteredVia).toBe(forwardPortal.key);
    expect(state.nodeHistory).toHaveLength(1);
    const backPortal = state.portals.find((portal) => portal.connection.kind === 'back');
    expect(backPortal).toBeTruthy();
    if (!backPortal) {
      return;
    }
    expect(state.ship.x).toBeCloseTo(backPortal.spawnAnchor.x, 5);
    expect(state.ship.y).toBeCloseTo(backPortal.spawnAnchor.y, 5);

    state.ship.x = backPortal.x;
    state.ship.y = backPortal.y;
    state.asteroids = [];
    state.bullets = [];
    state.portalCooldownUntil = 0;

    updateGame(state, createInputState(), 0, 2000);

    expect(state.seed).toBe(rootSeed);
    expect(state.currentNode.depth).toBe(0);
    expect(state.nodeHistory).toHaveLength(0);
    const returnPortal = state.portals.find((portal) => portal.key === forwardPortal.key);
    expect(returnPortal).toBeTruthy();
    if (!returnPortal) {
      return;
    }
    expect(state.ship.x).toBeCloseTo(returnPortal.spawnAnchor.x, 5);
    expect(state.ship.y).toBeCloseTo(returnPortal.spawnAnchor.y, 5);
  });

  it('increments score when a bullet hits an asteroid', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const state = createGameState(800, 600);
    state.ship.alive = false;
    state.asteroids = [
      {
        x: 120,
        y: 160,
        vx: 0,
        vy: 0,
        size: 3,
        radius: 56,
      },
    ];
    state.bullets = [
      {
        x: 120,
        y: 160,
        vx: 0,
        vy: 0,
        life: 1,
      },
    ];

    updateGame(state, createInputState(), 0, 1000);

    expect(state.score).toBe(300);
    expect(state.bullets).toHaveLength(0);
    expect(state.asteroids).toHaveLength(2);
    expect(state.asteroids.every((asteroid) => asteroid.size === 2)).toBe(true);
  });

  it('detects line segment intersections', () => {
    expect(linesIntersect(0, 0, 10, 0, 5, -5, 5, 5)).toBe(true);
    expect(linesIntersect(0, 0, 10, 0, 20, -5, 20, 5)).toBe(false);
  });

  it('bounces the ship when crossing a cave wall', () => {
    const state = createGameState(800, 600);
    state.cave = [
      { x: -10, y: -10 },
      { x: 10, y: -10 },
      { x: 10, y: 10 },
      { x: -10, y: 10 },
    ];
    state.asteroids = [];
    state.ship.x = 9;
    state.ship.y = 0;
    state.ship.vx = 5;
    state.ship.vy = 0;
    state.ship.invulnerableUntil = 0;

    updateGame(state, createInputState(), 1, 1000);

    expect(state.lives).toBe(3);
    expect(state.ship.alive).toBe(true);
    expect(state.ship.vx).toBeLessThan(0);
    expect(state.ship.x).toBe(9);
  });

  it('kills bullets when they cross a cave wall', () => {
    const state = createGameState(800, 600);
    state.cave = [
      { x: -10, y: -10 },
      { x: 10, y: -10 },
      { x: 10, y: 10 },
      { x: -10, y: 10 },
    ];
    state.ship.alive = false;
    state.asteroids = [];
    state.bullets = [
      {
        x: 9,
        y: 0,
        vx: 5,
        vy: 0,
        life: 1,
      },
    ];

    updateGame(state, createInputState(), 1, 1000);

    expect(state.bullets).toHaveLength(0);
  });

  it('bounces asteroids off cave walls', () => {
    const state = createGameState(800, 600);
    state.cave = [
      { x: -10, y: -10 },
      { x: 10, y: -10 },
      { x: 10, y: 10 },
      { x: -10, y: 10 },
    ];
    state.ship.alive = false;
    state.bullets = [];
    state.asteroids = [
      {
        x: 9,
        y: 0,
        vx: 5,
        vy: 0,
        size: 3,
        radius: 56,
      },
    ];

    updateGame(state, createInputState(), 1, 1000);

    expect(state.asteroids[0]!.vx).toBeLessThan(0);
    expect(state.asteroids[0]!.x).toBeLessThan(10);
  });

  it('respawns the ship at the cave origin', () => {
    const state = createGameState(800, 600);
    state.ship.alive = false;
    state.ship.x = 120;
    state.ship.y = 80;
    state.respawnAt = 1000;

    updateGame(state, createInputState(), 0, 1000);

    expect(state.ship.alive).toBe(true);
    expect(state.ship.x).toBe(0);
    expect(state.ship.y).toBe(0);
  });

  it('does not immediately hit the ship on a fresh update', () => {
    const state = createGameState(800, 600);

    updateGame(state, createInputState(), 0, 0);

    expect(state.lives).toBe(3);
    expect(state.ship.alive).toBe(true);
  });
});

describe('cave generation', () => {
  it('detects points inside a polygon', () => {
    const square = [
      { x: -10, y: -10 },
      { x: 10, y: -10 },
      { x: 10, y: 10 },
      { x: -10, y: 10 },
    ];

    expect(isPointInsidePolygon(0, 0, square)).toBe(true);
    expect(isPointInsidePolygon(20, 0, square)).toBe(false);
    expect(isPointInsidePolygon(-9, 9, square)).toBe(true);
  });

  it('generates a closed organic polygon', () => {
    const cave = generateCave();

    expect(cave.length).toBeGreaterThan(100);
    expect(cave[0]).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
  });

  it('generates the same portal layout for the same seed', () => {
    const first = createGameState(800, 600, 'CINDER-5D');
    const second = createGameState(800, 600, 'CINDER-5D');

    expect(first.portals.map((portal) => portal.key)).toEqual(second.portals.map((portal) => portal.key));
    expect(first.portals.map((portal) => [portal.x, portal.y, portal.connection.kind])).toEqual(
      second.portals.map((portal) => [portal.x, portal.y, portal.connection.kind]),
    );
  });
});
