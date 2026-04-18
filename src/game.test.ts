import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGameState, createInputState, loseLife, updateGame, wrap } from './game';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('game logic', () => {
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

  it('wraps values across both boundaries', () => {
    expect(wrap(-1, 10)).toBe(9);
    expect(wrap(11, 10)).toBe(1);
    expect(wrap(5, 10)).toBe(5);
  });

  it('does not lose a life while invulnerable', () => {
    const state = createGameState(800, 600);
    state.lives = 3;
    state.ship.invulnerableUntil = 2000;
    state.ship.alive = true;

    loseLife(state, 1000);

    expect(state.lives).toBe(3);
    expect(state.ship.alive).toBe(true);
    expect(state.respawnAt).toBe(0);
    expect(state.gameOver).toBe(false);
  });
});
