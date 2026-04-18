import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGameState, createInputState, updateGame } from '../src/game';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('updateGame', () => {
  it('damages and destroys an asteroid, then awards xp', () => {
    const state = createGameState(800, 600);
    state.ship.alive = false;
    state.player.attack = 18;
    state.asteroids = [
      {
        x: 120,
        y: 160,
        vx: 0,
        vy: 0,
        size: 3,
        radius: 56,
        hp: 18,
        maxHp: 18,
        xpReward: 60,
        contactDamage: 10,
      },
    ];
    state.bullets = [
      {
        x: 120,
        y: 160,
        vx: 0,
        vy: 0,
        life: 1,
        damage: 18,
      },
    ];

    updateGame(state, createInputState(), 0, 1000);

    expect(state.player.level).toBe(2);
    expect(state.player.xp).toBe(12);
    expect(state.player.hp).toBe(74);
    expect(state.bullets).toHaveLength(0);
    expect(state.asteroids).toHaveLength(0);
  });

  it('reduces player hp on asteroid contact', () => {
    const state = createGameState(800, 600);
    state.ship.x = 240;
    state.ship.y = 180;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.ship.alive = true;
    state.ship.invulnerableUntil = 0;
    state.player.hp = 60;
    state.asteroids = [
      {
        x: 240,
        y: 180,
        vx: 0,
        vy: 0,
        size: 3,
        radius: 56,
        hp: 24,
        maxHp: 24,
        xpReward: 12,
        contactDamage: 10,
      },
    ];

    updateGame(state, createInputState(), 0, 1000);

    expect(state.player.hp).toBe(50);
    expect(state.ship.alive).toBe(true);
    expect(state.gameOver).toBe(false);
  });
});
