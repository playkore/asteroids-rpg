import { describe, expect, it } from 'vitest';
import { createPlayerStats, gainPlayerXp, playerShotDamage, xpToNextLevel } from '../src/rpg';

describe('rpg progression', () => {
  it('creates the default player stats', () => {
    expect(createPlayerStats()).toEqual({
      level: 1,
      xp: 0,
      hp: 10,
      maxHp: 10,
      attack: 2,
    });
  });

  it('uses the fixed first-version xp curve', () => {
    expect(xpToNextLevel(1)).toBe(5);
    expect(xpToNextLevel(2)).toBe(8);
    expect(xpToNextLevel(3)).toBe(11);
  });

  it('uses damage proportional to player level', () => {
    expect(playerShotDamage(1)).toBe(2);
    expect(playerShotDamage(2)).toBe(3);
    expect(playerShotDamage(4)).toBe(5);
  });

  it('levels up, restores hp, and increases attack', () => {
    const player = createPlayerStats();
    player.hp = 4;

    const leveledUp = gainPlayerXp(player, 10);

    expect(leveledUp).toBe(true);
    expect(player.level).toBe(2);
    expect(player.xp).toBe(5);
    expect(player.maxHp).toBe(12);
    expect(player.hp).toBe(12);
    expect(player.attack).toBe(3);
  });
});
