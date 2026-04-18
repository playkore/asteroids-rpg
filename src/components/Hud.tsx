import type { HudState } from '../game';

export default function Hud({ hud }: { hud: Pick<HudState, 'score' | 'lives' | 'wave' | 'seed'> }) {
  const copySeed = async () => {
    if (!navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(hud.seed);
  };

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
      <button className="hud__pill hud__pill--seed" type="button" onClick={() => void copySeed()}>
        <span>Seed</span>
        <strong>{hud.seed}</strong>
      </button>
    </div>
  );
}
