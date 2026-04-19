import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cellKey,
  createGameState,
  createInputState,
  buildHudState,
  generateCellRecord,
  hydrateGameState,
  prepareGameStateForSave,
  shouldAutoShoot,
  summarizeSectorAsteroidHp,
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

  it('can still generate combat cells deep in positive y', () => {
    const cell = generateCellRecord('CINDER-5D', { x: 1, y: 13 });

    expect(cell.kind).toBe('combat');
    expect(cell.remaining).toEqual({ 3: 3, 2: 0, 1: 0 });
  });

  it('summarizes current and future asteroid hp for the sector', () => {
    const summary = summarizeSectorAsteroidHp(
      [
        {
          x: 10,
          y: 10,
          vx: 0,
          vy: 0,
          size: 3,
          radius: 56,
          hp: 7,
          maxHp: 12,
          xpReward: 4,
          contactDamage: 3,
          hpVisible: false,
        },
        {
          x: 20,
          y: 20,
          vx: 0,
          vy: 0,
          size: 2,
          radius: 34,
          hp: 4,
          maxHp: 6,
          xpReward: 2,
          contactDamage: 2,
          hpVisible: false,
        },
      ],
      1,
    );

    expect(summary).toEqual({
      currentHp: 65,
      totalHp: 72,
      hasAsteroids: true,
    });
  });

  it('generates combat cells on 254 of the first 1000 levels for x=0', () => {
    let combatCount = 0;

    for (let y = 0; y < 1000; y += 1) {
      if (generateCellRecord('CINDER-5D', { x: 0, y }).kind === 'combat') {
        combatCount += 1;
      }
    }

    expect(combatCount).toBe(254);
  });

  it('only auto shoots when there are asteroids in the field', () => {
    const emptyState = createGameState(320, 240, 'CINDER-5D');
    emptyState.asteroids = [];

    const combatState = createGameState(320, 240, 'CINDER-5D');
    combatState.asteroids = [
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
        contactDamage: 3,
        hpVisible: false,
      },
    ];

    expect(shouldAutoShoot(emptyState)).toBe(false);
    expect(shouldAutoShoot(combatState)).toBe(true);
  });

  it('adds a slight spread to fired projectiles', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.x = 160;
    state.ship.y = 120;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.ship.angle = 0;

    const input = createInputState();
    input.shootRequested = true;

    updateGame(state, input, 0, 1000);

    expect(state.bullets).toHaveLength(1);
    const bullet = state.bullets[0]!;
    expect(Math.atan2(bullet.vy, bullet.vx)).toBeCloseTo(-0.0142, 3);
  });

  it('adds recoil and transient feedback when firing', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.x = 160;
    state.ship.y = 120;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.ship.angle = 0;

    const input = createInputState();
    input.shootRequested = true;

    updateGame(state, input, 0, 1000);

    expect(state.ship.vx).toBeCloseTo(-18);
    expect(state.ship.recoilUntil).toBe(1070);
    expect(state.bullets).toHaveLength(1);
    expect(state.bullets[0]?.trailUntil).toBe(1090);
    expect(state.particles.length).toBeGreaterThan(0);
    expect(state.flashes.length).toBeGreaterThan(0);
    expect(state.shake.amplitude).toBe(1.5);
  });

  it('keeps sector asteroid total hp fixed for the whole cell while current hp decreases', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.cells[cellKey(state.currentCell)] = {
      kind: 'combat',
      visited: true,
      cleared: false,
      remaining: { 3: 3, 2: 0, 1: 0 },
    };
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
        contactDamage: 3,
        hpVisible: false,
      },
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
        contactDamage: 3,
        hpVisible: false,
      },
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
        contactDamage: 3,
        hpVisible: false,
      },
    ];

    const initialHud = buildHudState(state, true);

    state.asteroids = [
      {
        x: 120,
        y: 120,
        vx: 0,
        vy: 0,
        size: 2,
        radius: 34,
        hp: 6,
        maxHp: 6,
        xpReward: 2,
        contactDamage: 2,
        hpVisible: false,
      },
      {
        x: 120,
        y: 120,
        vx: 0,
        vy: 0,
        size: 2,
        radius: 34,
        hp: 6,
        maxHp: 6,
        xpReward: 2,
        contactDamage: 2,
        hpVisible: false,
      },
      {
        x: 120,
        y: 120,
        vx: 0,
        vy: 0,
        size: 2,
        radius: 34,
        hp: 6,
        maxHp: 6,
        xpReward: 2,
        contactDamage: 2,
        hpVisible: false,
      },
    ];

    const afterSplitHud = buildHudState(state, true);

    expect(afterSplitHud.sectorAsteroidHpTotal).toBe(initialHud.sectorAsteroidHpTotal);
    expect(afterSplitHud.sectorAsteroidHpCurrent).toBeLessThan(initialHud.sectorAsteroidHpCurrent);
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

  it('resets an uncompleted combat cell to three large asteroids when revisited', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.cells[cellKey(state.currentCell)] = {
      kind: 'combat',
      visited: true,
      cleared: false,
      remaining: { 3: 3, 2: 0, 1: 0 },
    };
    state.asteroids = [
      {
        x: 160,
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
    state.ship.x = 160;
    state.ship.y = -1;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.transitionCooldownUntil = 0;
    state.ship.invulnerableUntil = 0;

    updateGame(state, createInputState(), 0, 1000);

    expect(state.currentCell).toEqual({ x: 0, y: 1 });
    expect(state.cells[cellKey({ x: 0, y: 0 })]?.remaining).toEqual({
      3: 3,
      2: 0,
      1: 0,
    });

    state.ship.x = 160;
    state.ship.y = 241;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.transitionCooldownUntil = 0;
    state.ship.invulnerableUntil = 0;

    updateGame(state, createInputState(), 0, 2000);

    expect(state.currentCell).toEqual({ x: 0, y: 0 });
    expect(state.asteroids).toHaveLength(3);
    expect(state.asteroids.every((asteroid) => asteroid.size === 3)).toBe(true);
  });

  it('spawns asteroids in the center of a new combat cell with varied directions', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.cells[cellKey(state.currentCell)] = {
      kind: 'empty',
      visited: true,
      cleared: false,
      remaining: { 3: 0, 2: 0, 1: 0 },
    };
    state.cells[cellKey({ x: 0, y: 1 })] = {
      kind: 'combat',
      visited: true,
      cleared: false,
      remaining: { 3: 3, 2: 0, 1: 0 },
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
    expect(state.asteroids).toHaveLength(3);
    expect(state.asteroids.every((asteroid) => asteroid.x === 160 && asteroid.y === 120)).toBe(true);
    expect(state.asteroids.every((asteroid) => Math.hypot(asteroid.vx, asteroid.vy) > 0)).toBe(true);
    expect(new Set(state.asteroids.map((asteroid) => Math.atan2(asteroid.vy, asteroid.vx).toFixed(3))).size).toBeGreaterThan(1);
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

  it('keeps the bottom-most y cell at -4 when moving further down', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.currentCell = { x: 0, y: -4 };
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

    expect(state.currentCell).toEqual({ x: 0, y: -4 });
    expect(state.ship.y).toBe(1);
  });

  it('wraps horizontally from the right edge back to x=0', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.currentCell = { x: 6, y: 0 };
    state.cells[cellKey(state.currentCell)] = {
      kind: 'empty',
      visited: true,
      cleared: false,
      remaining: { 3: 0, 2: 0, 1: 0 },
    };
    state.asteroids = [];
    state.ship.x = 321;
    state.ship.y = 120;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.transitionCooldownUntil = 0;
    state.ship.invulnerableUntil = 0;

    updateGame(state, createInputState(), 0, 1000);

    expect(state.currentCell).toEqual({ x: 0, y: 0 });
    expect(state.ship.x).toBe(1);
    expect(state.cells[cellKey({ x: 0, y: 0 })]).toBeTruthy();
  });

  it('wraps horizontally from the left edge back to x=6', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.currentCell = { x: 0, y: 0 };
    state.cells[cellKey(state.currentCell)] = {
      kind: 'empty',
      visited: true,
      cleared: false,
      remaining: { 3: 0, 2: 0, 1: 0 },
    };
    state.asteroids = [];
    state.ship.x = -1;
    state.ship.y = 120;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.transitionCooldownUntil = 0;
    state.ship.invulnerableUntil = 0;

    updateGame(state, createInputState(), 0, 1000);

    expect(state.currentCell).toEqual({ x: 6, y: 0 });
    expect(state.ship.x).toBe(319);
    expect(state.cells[cellKey({ x: 6, y: 0 })]).toBeTruthy();
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

  it('adds hit feedback when a bullet damages but does not destroy an asteroid', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.alive = false;
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
        contactDamage: 3,
        hpVisible: false,
      },
    ];
    state.bullets = [
      {
        x: 120,
        y: 120,
        vx: 9,
        vy: 0,
        life: 1,
        damage: 1,
      },
    ];

    updateGame(state, createInputState(), 0, 1000);

    expect(state.asteroids).toHaveLength(1);
    expect(state.asteroids[0]?.hp).toBe(11);
    expect(state.asteroids[0]?.hitFlashUntil).toBe(1080);
    expect(state.asteroids[0]?.hitScaleUntil).toBe(1090);
    expect(state.particles.length).toBeGreaterThan(0);
    expect(state.flashes.length).toBeGreaterThan(0);
    expect(state.shake.amplitude).toBeGreaterThan(0);
  });

  it('adds burst feedback when a bullet destroys an asteroid', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.alive = false;
    state.player.xp = 0;
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
    expect(state.particles.length).toBeGreaterThan(10);
    expect(state.flashes.length).toBeGreaterThan(0);
    expect(state.shake.amplitude).toBeGreaterThanOrEqual(4);
  });

  it('expires transient particles over time', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.alive = false;
    state.particles = [
      {
        x: 10,
        y: 10,
        vx: 0,
        vy: 0,
        life: 0.01,
        maxLife: 0.01,
        size: 2,
        kind: 'spark',
      },
    ];

    updateGame(state, createInputState(), 0.02, 1000);

    expect(state.particles).toHaveLength(0);
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

  it('respawns at the last cleared cell and keeps the map after lethal contact', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.currentCell = { x: 2, y: 1 };
    state.lastClearedCell = { x: 1, y: 0 };
    state.cells[cellKey({ x: 1, y: 0 })] = {
      kind: 'combat',
      visited: true,
      cleared: true,
      remaining: { 3: 0, 2: 0, 1: 0 },
    };
    state.cells[cellKey({ x: 2, y: 1 })] = {
      kind: 'combat',
      visited: true,
      cleared: false,
      remaining: { 3: 1, 2: 0, 1: 0 },
    };
    state.cells[cellKey({ x: -1, y: 0 })] = {
      kind: 'empty',
      visited: true,
      cleared: false,
      remaining: { 3: 0, 2: 0, 1: 0 },
    };
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

    expect(state.player.hp).toBe(state.player.maxHp);
    expect(state.ship.alive).toBe(true);
    expect(state.gameOver).toBe(false);
    expect(state.currentCell).toEqual({ x: 1, y: 0 });
    expect(state.ship.x).toBe(160);
    expect(state.ship.y).toBe(120);
    expect(state.respawnBlinkUntil).toBeGreaterThan(1000);
    expect(state.cells[cellKey({ x: 2, y: 1 })]?.remaining).toEqual({
      3: 3,
      2: 0,
      1: 0,
    });
    expect(state.cells[cellKey({ x: -1, y: 0 })]).toBeTruthy();
  });

  it('falls back to the starting cell when no cells have been cleared yet', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.cells[cellKey(state.currentCell)] = {
      kind: 'empty',
      visited: true,
      cleared: false,
      remaining: { 3: 0, 2: 0, 1: 0 },
    };
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

    expect(state.currentCell).toEqual({ x: 0, y: 0 });
    expect(state.player.hp).toBe(state.player.maxHp);
    expect(state.ship.alive).toBe(true);
    expect(state.respawnBlinkUntil).toBeGreaterThan(1000);
  });

  it('bounces the ship and a small asteroid off each other while still dealing contact damage', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.x = 100;
    state.ship.y = 120;
    state.ship.vx = 10;
    state.ship.vy = 0;
    state.ship.alive = true;
    state.ship.invulnerableUntil = 0;
    state.player.hp = 5;
    state.asteroids = [
      {
        x: 120,
        y: 120,
        vx: 0,
        vy: 0,
        size: 1,
        radius: 20,
        hp: 12,
        maxHp: 12,
        xpReward: 1,
        contactDamage: 1,
        hpVisible: false,
      },
    ];

    updateGame(state, createInputState(), 0, 1000);

    expect(state.player.hp).toBe(4);
    expect(state.ship.vx).toBeCloseTo(0);
    expect(state.asteroids[0]?.vx).toBeCloseTo(9.92);
  });

  it('uses the asteroid mass when bouncing against a medium asteroid', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.x = 100;
    state.ship.y = 120;
    state.ship.vx = 10;
    state.ship.vy = 0;
    state.ship.alive = true;
    state.ship.invulnerableUntil = 0;
    state.player.hp = 5;
    state.asteroids = [
      {
        x: 120,
        y: 120,
        vx: 0,
        vy: 0,
        size: 2,
        radius: 34,
        hp: 12,
        maxHp: 12,
        xpReward: 2,
        contactDamage: 2,
        hpVisible: false,
      },
    ];

    updateGame(state, createInputState(), 0, 1000);

    expect(state.player.hp).toBe(3);
    expect(state.ship.vx).toBeCloseTo(-4.96);
    expect(state.asteroids[0]?.vx).toBeCloseTo(4.96);
  });

  it('pushes smaller asteroids faster than larger ones when hit by the same bullet', () => {
    const createHitState = (size: 3 | 2 | 1) => {
      const state = createGameState(320, 240, 'CINDER-5D');
      state.ship.alive = false;
      state.asteroids = [
        {
          x: 120,
          y: 120,
          vx: 0,
          vy: 0,
          size,
          radius: size === 3 ? 56 : size === 2 ? 34 : 20,
          hp: 12,
          maxHp: 12,
          xpReward: size === 3 ? 4 : size === 2 ? 2 : 1,
          contactDamage: size === 3 ? 3 : size === 2 ? 2 : 1,
          hpVisible: false,
        },
      ];
      state.bullets = [
        {
          x: 120,
          y: 120,
          vx: 9,
          vy: 0,
          life: 1,
          damage: 1,
        },
      ];
      return state;
    };

    const small = createHitState(1);
    const medium = createHitState(2);
    const large = createHitState(3);

    updateGame(small, createInputState(), 0, 1000);
    updateGame(medium, createInputState(), 0, 1000);
    updateGame(large, createInputState(), 0, 1000);

    expect(small.asteroids[0]?.vx).toBeCloseTo(9);
    expect(medium.asteroids[0]?.vx).toBeCloseTo(3);
    expect(large.asteroids[0]?.vx).toBeCloseTo(1);
  });

  it('hydrates a combat cell but resets it to the original large asteroids when saving progress', () => {
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
      lastClearedCell: { x: 1, y: 2 },
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
    expect(hydrated.asteroids.every((asteroid) => asteroid.size === 2 || asteroid.size === 1)).toBe(true);
    prepareGameStateForSave(hydrated);
    expect(hydrated.cells['1:2']?.remaining).toEqual({
      3: 3,
      2: 0,
      1: 0,
    });
  });

  it('hydrates using the current canvas size when provided', () => {
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
      lastClearedCell: { x: 1, y: 2 },
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

    const hydrated = hydrateGameState(snapshot, 200, 200);

    expect(hydrated.width).toBe(200);
    expect(hydrated.height).toBe(200);
    expect(hydrated.asteroids).toHaveLength(3);
    expect(hydrated.asteroids.every((asteroid) => asteroid.x >= 20 && asteroid.x <= 180)).toBe(true);
    expect(hydrated.asteroids.every((asteroid) => asteroid.y >= 20 && asteroid.y <= 180)).toBe(true);
  });

  it('ignores stale session timers when hydrating a saved game', () => {
    const snapshot: SaveSlotData = {
      version: 1,
      seed: 'CINDER-5D',
      width: 320,
      height: 240,
      currentCell: { x: 0, y: 0 },
      ship: {
        x: 160,
        y: -1,
        vx: 0,
        vy: 0,
        angle: 0,
        invulnerableUntil: 999999,
        alive: true,
        recoilUntil: 999999,
      },
      player: {
        level: 1,
        xp: 0,
        hp: 10,
        maxHp: 10,
        attack: 2,
      },
      nextShotAt: 999999,
      transitionCooldownUntil: 999999,
      regenAccumulator: 0,
      spawnCounter: 0,
      gameOver: false,
      lastClearedCell: { x: 0, y: 0 },
      cells: {
        '0:0': {
          kind: 'empty',
          visited: true,
          cleared: false,
          remaining: { 3: 0, 2: 0, 1: 0 },
        },
      },
      savedAt: 0,
    };

    const state = hydrateGameState(snapshot);

    updateGame(state, createInputState(), 0, 1000);

    expect(state.currentCell).toEqual({ x: 0, y: 1 });
    expect(state.ship.y).toBeCloseTo(239);
    expect(state.nextShotAt).toBe(0);
    expect(state.transitionCooldownUntil).toBeGreaterThan(0);
    expect(state.ship.recoilUntil).toBe(0);
  });
});
