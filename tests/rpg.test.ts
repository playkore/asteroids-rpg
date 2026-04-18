import { describe, expect, it } from 'vitest';
import { createPlayerStats, gainPlayerXp, xpForLevel, xpToNextLevel } from '../src/rpg';

describe('rpg progression', () => {
  it('creates the default player stats', () => {
    expect(createPlayerStats()).toEqual({
      level: 1,
      xp: 0,
      hp: 60,
      maxHp: 60,
      attack: 9,
    });
  });

  it('uses the rpg-core xp formulas', () => {
    expect(xpForLevel(1)).toBe(10);
    expect(xpForLevel(2)).toBe(16);
    expect(xpForLevel(3)).toBe(30);
    expect(xpToNextLevel(1)).toBe(48);
    expect(xpToNextLevel(2)).toBe(68);
  });

  it('levels up, restores hp, and increases attack', () => {
    const player = createPlayerStats();
    player.hp = 23;

    const leveledUp = gainPlayerXp(player, 60);

    expect(leveledUp).toBe(true);
    expect(player.level).toBe(2);
    expect(player.xp).toBe(12);
    expect(player.maxHp).toBe(74);
    expect(player.hp).toBe(74);
    expect(player.attack).toBe(12);
  });
});
