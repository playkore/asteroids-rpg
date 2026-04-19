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
    hp: 10,
    maxHp: 10,
    attack: 2,
  };
}

export function xpToNextLevel(level: number) {
  return 5 + 3 * (level - 1);
}

export function playerShotDamage(level: number) {
  return 2 + (level - 1);
}

export function gainPlayerXp(player: PlayerStats, amount: number) {
  player.xp += amount;

  let leveledUp = false;
  while (player.xp >= xpToNextLevel(player.level)) {
    const required = xpToNextLevel(player.level);
    player.xp -= required;
    player.level += 1;
    player.maxHp += 2;
    player.attack = playerShotDamage(player.level);
    player.hp = player.maxHp;
    leveledUp = true;
  }

  return leveledUp;
}
