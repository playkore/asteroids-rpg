import type { SaveBundle, SaveSlotIndex } from '../save';

type StartScreenProps = {
  seed: string;
  onSeedChange: (value: string) => void;
  onRoll: () => void;
  onContinue: () => void;
  onNewGame: (slot: SaveSlotIndex) => void;
  onLoadGame: (slot: SaveSlotIndex) => void;
  paused: boolean;
  saveBundle: SaveBundle;
};

function formatSlotLabel(slot: SaveBundle['slots'][number], index: number) {
  if (!slot) {
    return `Slot ${index + 1} · Empty`;
  }

  const cell = `${slot.currentCell.x},${slot.currentCell.y}`;
  return `Slot ${index + 1} · ${slot.seed} · Cell ${cell}`;
}

export default function StartScreen({
  seed,
  onSeedChange,
  onRoll,
  onContinue,
  onNewGame,
  onLoadGame,
  paused,
  saveBundle,
}: StartScreenProps) {
  const canContinue = saveBundle.lastSlot !== null && Boolean(saveBundle.slots[saveBundle.lastSlot]);

  return (
    <div className="start-screen">
      <div className="start-screen__panel">
        <h1>{paused ? 'Paused' : 'Asteroids RPG'}</h1>
        <label className="start-screen__seed" htmlFor="seed-input">
          <span>Seed</span>
          <input
            id="seed-input"
            className="start-screen__input"
            type="text"
            value={seed}
            onChange={(event) => onSeedChange(event.target.value)}
            spellCheck={false}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
          />
        </label>
        <div className="start-screen__actions">
          <button className="overlay__button" type="button" onClick={onRoll}>
            Roll
          </button>
          <button
            className="overlay__button start-screen__primary"
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
          >
            Continue
          </button>
        </div>

        <div className="start-screen__slots">
          <div className="start-screen__group">
            <h2>New Game</h2>
            <div className="start-screen__slot-list">
              {saveBundle.slots.map((slot, index) => (
                <button
                  key={`new-${index}`}
                  className="overlay__button start-screen__slot-button"
                  type="button"
                  onClick={() => onNewGame(index as SaveSlotIndex)}
                >
                  {formatSlotLabel(slot, index)}
                </button>
              ))}
            </div>
          </div>

          <div className="start-screen__group">
            <h2>Load Game</h2>
            <div className="start-screen__slot-list">
              {saveBundle.slots.map((slot, index) => (
                <button
                  key={`load-${index}`}
                  className="overlay__button start-screen__slot-button"
                  type="button"
                  onClick={() => onLoadGame(index as SaveSlotIndex)}
                  disabled={!slot}
                >
                  {formatSlotLabel(slot, index)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
