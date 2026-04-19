import type { CSSProperties } from 'react';
import type { HudState } from '../game';
import { formatHudCellCoord } from '../coordLabels';
import { xpToNextLevel } from '../rpg';

function progressWidth(current: number, max: number) {
  if (max <= 0) {
    return '0%';
  }
  return `${Math.max(0, Math.min(100, (current / max) * 100))}%`;
}

export default function Hud({
  hud,
  style,
  onMenuClick,
}: {
  hud: HudState;
  style?: CSSProperties;
  onMenuClick?: () => void;
}) {
  const xpMax = xpToNextLevel(hud.player.level);
  const hasSectorAsteroids = hud.sectorHasAsteroids && hud.sectorAsteroidHpTotal > 0;
  const sectorTitle = hud.cell.y < 0 ? 'SECTOR VOID' : `${formatHudCellCoord(hud.cell.x, hud.cell.y)}`;

  return (
    <div className="hud" style={style}>
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
      <div className="hud__pill hud__pill--sector">
        <span className="hud__sector-title">{sectorTitle}</span>
        {hasSectorAsteroids ? (
          <div className="hud__meter">
            <div
              className="hud__meter-fill"
              style={{
                width: `${Math.max(0, Math.min(100, (hud.sectorAsteroidHpCurrent / hud.sectorAsteroidHpTotal) * 100))}%`,
              }}
            />
          </div>
        ) : (
          <strong className="hud__sector-clear">CLEAR</strong>
        )}
        <strong className="hud__sector-hp">{hasSectorAsteroids ? `${hud.sectorAsteroidHpCurrent} / ${hud.sectorAsteroidHpTotal}` : ''}</strong>
      </div>
      {onMenuClick ? (
        <button className="hud__menu-button" type="button" onClick={onMenuClick}>
          Menu
        </button>
      ) : null}
    </div>
  );
}
