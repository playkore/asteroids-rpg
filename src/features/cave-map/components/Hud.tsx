import type { HudState } from '../types';

export default function Hud({ hud }: { hud: Pick<HudState, 'score' | 'lives' | 'wave'> }) {
  return (
    <div className="hud">
      <div className="hud__pill">
        <span>Score</span>
        <strong>{hud.score}</strong>
      </div>
      <div className="hud__pill">
        <span>Lives</span>
        <strong>{hud.lives}</strong>
      </div>
      <div className="hud__pill">
        <span>Wave</span>
        <strong>{hud.wave}</strong>
      </div>
    </div>
  );
}
