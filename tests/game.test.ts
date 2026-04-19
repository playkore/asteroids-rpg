import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cellKey,
  createGameState,
  createInputState,
  generateCellRecord,
  hydrateGameState,
  prepareGameStateForSave,
  updateGame,
} from '../src/game';
import type { SaveSlotData } from '../src/save';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('game logic', () => {
  it('generates cells deterministically from the seed and coordinates', () => {
    const first = generateCellRecord('CINDER-5D', { x: 2, y: 3 });
    const second = generateCellRecord('CINDER-5D', { x: 2, y: 3 });

    expect(first).toEqual(second);
  });

  it('always generates cells below y=0 as empty', () => {
    const cell = generateCellRecord('CINDER-5D', { x: 2, y: -1 });

    expect(cell.kind).toBe('empty');
    expect(cell.remaining).toEqual({ 3: 0, 2: 0, 1: 0 });
  });

  it('moves the player into the cell above when crossing the top edge', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.cells[cellKey(state.currentCell)] = {
      kind: 'empty',
      visited: true,
      cleared: false,
      remaining: { 3: 0, 2: 0, 1: 0 },
    };
    state.asteroids = [];
    state.ship.x = 160;
    state.ship.y = -1;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.transitionCooldownUntil = 0;
    state.ship.invulnerableUntil = 0;

    updateGame(state, createInputState(), 0, 1000);

    expect(state.currentCell).toEqual({ x: 0, y: 1 });
    expect(state.ship.y).toBeCloseTo(239);
    expect(state.cells[cellKey({ x: 0, y: 1 })]).toBeTruthy();
    expect(state.saveRequested).toBe(true);
  });

  it('allows the player to move into negative y cells and keeps them empty', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.cells[cellKey(state.currentCell)] = {
      kind: 'empty',
      visited: true,
      cleared: false,
      remaining: { 3: 0, 2: 0, 1: 0 },
    };
    state.asteroids = [];
    state.ship.x = 160;
    state.ship.y = 241;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.transitionCooldownUntil = 0;
    state.ship.invulnerableUntil = 0;

    updateGame(state, createInputState(), 0, 1000);

    expect(state.currentCell).toEqual({ x: 0, y: -1 });
    expect(state.ship.y).toBe(1);
    expect(state.cells[cellKey({ x: 0, y: -1 })]?.kind).toBe('empty');
  });

  it('wraps asteroids around the screen', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.alive = false;
    state.asteroids = [
      {
        x: -5,
        y: 120,
        vx: 0,
        vy: 0,
        size: 3,
        radius: 56,
        hp: 12,
        maxHp: 12,
        xpReward: 4,
        contactDamage: 3,
        hpVisible: false,
      },
    ];

    updateGame(state, createInputState(), 1, 1000);

    expect(state.asteroids[0]?.x).toBe(315);
  });

  it('splits large asteroids into three medium asteroids', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.alive = false;
    state.player.xp = 0;
    state.cells[cellKey(state.currentCell)] = {
      kind: 'combat',
      visited: true,
      cleared: false,
      remaining: { 3: 1, 2: 0, 1: 0 },
    };
    state.asteroids = [
      {
        x: 120,
        y: 120,
        vx: 0,
        vy: 0,
        size: 3,
        radius: 56,
        hp: 1,
        maxHp: 1,
        xpReward: 4,
        contactDamage: 3,
        hpVisible: false,
      },
    ];
    state.bullets = [
      {
        x: 120,
        y: 120,
        vx: 0,
        vy: 0,
        life: 1,
        damage: 10,
      },
    ];

    updateGame(state, createInputState(), 0, 1000);

    expect(state.player.xp).toBe(4);
    expect(state.asteroids).toHaveLength(3);
    expect(state.asteroids.every((asteroid) => asteroid.size === 2)).toBe(true);
  });

  it('clears a cell, grants the clear reward, and levels up through xp', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.alive = false;
    state.player.xp = 4;
    state.player.hp = 6;
    state.cells[cellKey(state.currentCell)] = {
      kind: 'combat',
      visited: true,
      cleared: false,
      remaining: { 3: 0, 2: 0, 1: 1 },
    };
    state.asteroids = [
      {
        x: 120,
        y: 120,
        vx: 0,
        vy: 0,
        size: 1,
        radius: 20,
        hp: 1,
        maxHp: 1,
        xpReward: 1,
        contactDamage: 1,
        hpVisible: false,
      },
    ];
    state.bullets = [
      {
        x: 120,
        y: 120,
        vx: 0,
        vy: 0,
        life: 1,
        damage: 1,
      },
    ];

    updateGame(state, createInputState(), 0, 1000);

    expect(state.player.level).toBe(2);
    expect(state.player.xp).toBe(3);
    expect(state.player.maxHp).toBe(12);
    expect(state.player.hp).toBe(12);
    expect(state.cells[cellKey(state.currentCell)]?.cleared).toBe(true);
    expect(state.asteroids).toHaveLength(0);
  });

  it('reduces player hp and ends the run on lethal contact', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.x = 120;
    state.ship.y = 120;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.ship.alive = true;
    state.ship.invulnerableUntil = 0;
    state.player.hp = 1;
    state.asteroids = [
      {
        x: 120,
        y: 120,
        vx: 0,
        vy: 0,
        size: 3,
        radius: 56,
        hp: 12,
        maxHp: 12,
        xpReward: 4,
        contactDamage: 1,
        hpVisible: false,
      },
    ];

    updateGame(state, createInputState(), 0, 1000);

    expect(state.player.hp).toBe(0);
    expect(state.ship.alive).toBe(false);
    expect(state.gameOver).toBe(true);
  });

  it('hydrates a partially cleared cell from saved counts', () => {
    const snapshot: SaveSlotData = {
      version: 1,
      seed: 'CINDER-5D',
      width: 320,
      height: 240,
      currentCell: { x: 1, y: 2 },
      ship: {
        x: 160,
        y: 120,
        vx: 0,
        vy: 0,
        angle: 0,
        invulnerableUntil: 0,
        alive: true,
      },
      player: {
        level: 2,
        xp: 3,
        hp: 12,
        maxHp: 12,
        attack: 3,
      },
      nextShotAt: 0,
      transitionCooldownUntil: 0,
      regenAccumulator: 0,
      spawnCounter: 0,
      gameOver: false,
      cells: {
        '1:2': {
          kind: 'combat',
          visited: true,
          cleared: false,
          remaining: {
            3: 0,
            2: 2,
            1: 1,
          },
        },
      },
      savedAt: 0,
    };

    const hydrated = hydrateGameState(snapshot);

    expect(hydrated.currentCell).toEqual({ x: 1, y: 2 });
    expect(hydrated.asteroids).toHaveLength(3);
    expect(hydrated.asteroids.map((asteroid) => asteroid.size).sort()).toEqual([1, 2, 2]);
    prepareGameStateForSave(hydrated);
    expect(hydrated.cells['1:2']?.remaining).toEqual({
      3: 0,
      2: 2,
      1: 1,
    });
  });
});
