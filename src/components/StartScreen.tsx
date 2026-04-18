type StartScreenProps = {
  seed: string;
  onSeedChange: (value: string) => void;
  onRoll: () => void;
  onStart: () => void;
};

export default function StartScreen({ seed, onSeedChange, onRoll, onStart }: StartScreenProps) {
  return (
    <div className="start-screen">
      <div className="start-screen__panel">
        <h1>Asteroids RPG</h1>
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
          <button className="overlay__button start-screen__primary" type="button" onClick={onStart}>
            Start Adventure
          </button>
        </div>
      </div>
    </div>
  );
}
