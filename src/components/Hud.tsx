import type { HudState } from '../game';
import { xpToNextLevel } from '../rpg';

function progressWidth(current: number, max: number) {
  if (max <= 0) {
    return '0%';
  }
  return `${Math.max(0, Math.min(100, (current / max) * 100))}%`;
}

export default function Hud({ hud }: { hud: HudState }) {
  const copySeed = async () => {
    if (!navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(hud.seed);
  };

  const xpMax = xpToNextLevel(hud.player.level);

  return (
    <div className="hud">
      <div className="hud__pill hud__pill--meter">
        <span>HP</span>
        <div className="hud__meter">
          <div className="hud__meter-fill" style={{ width: progressWidth(hud.player.hp, hud.player.maxHp) }} />
        </div>
        <strong>
          {hud.player.hp} / {hud.player.maxHp}
        </strong>
      </div>
      <div className="hud__pill hud__pill--meter">
        <span>XP</span>
        <div className="hud__meter">
          <div className="hud__meter-fill" style={{ width: progressWidth(hud.player.xp, xpMax) }} />
        </div>
        <strong>
          {hud.player.xp} / {xpMax}
        </strong>
      </div>
      <div className="hud__pill hud__pill--seed">
        <span>
          Lv {hud.player.level} · ATK {hud.player.attack}
        </span>
        <strong>
          Cell {hud.cell.x}, {hud.cell.y} · L{hud.cellLevel}
        </strong>
        <button className="hud__seed-button" type="button" onClick={() => void copySeed()}>
          {hud.seed}
        </button>
      </div>
    </div>
  );
}
