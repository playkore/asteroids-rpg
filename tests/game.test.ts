import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGameState, createInputState, updateGame } from '../src/game';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('updateGame', () => {
  it('scores and splits a destroyed asteroid', () => {
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

  it('loses a life when the ship collides with an asteroid', () => {
    const state = createGameState(800, 600);
    state.ship.x = 240;
    state.ship.y = 180;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.ship.alive = true;
    state.ship.invulnerableUntil = 0;
    state.asteroids = [
      {
        x: 240,
        y: 180,
        vx: 0,
        vy: 0,
        size: 3,
        radius: 56,
      },
    ];

    updateGame(state, createInputState(), 0, 1000);

    expect(state.lives).toBe(2);
    expect(state.ship.alive).toBe(false);
    expect(state.respawnAt).toBeGreaterThan(1000);
    expect(state.gameOver).toBe(false);
  });
});
