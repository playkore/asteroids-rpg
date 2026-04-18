export type PlayerStats = {
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  attack: number;
};

export function createPlayerStats(): PlayerStats {
  return {
    level: 1,
    xp: 0,
    hp: 60,
    maxHp: 60,
    attack: 9,
  };
}

export function xpForLevel(level: number) {
  return Math.round(10 + 4 * (level - 1) ** 2 + 2 * (level - 1));
}

export function xpToNextLevel(level: number) {
  return 28 + level * 20;
}

export function gainPlayerXp(player: PlayerStats, amount: number) {
  player.xp += amount;

  let leveledUp = false;
  while (player.xp >= xpToNextLevel(player.level)) {
    const required = xpToNextLevel(player.level);
    player.xp -= required;
    player.level += 1;
    player.maxHp += 14;
    player.attack += 3;
    player.hp = player.maxHp;
    leveledUp = true;
  }

  return leveledUp;
}
